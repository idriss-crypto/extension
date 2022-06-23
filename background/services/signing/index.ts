import { StatusCodes, TransportStatusError } from "@ledgerhq/errors"
import KeyringService from "../keyring"
import LedgerService from "../ledger"
import { EIP1559TransactionRequest, SignedEVMTransaction } from "../../networks"
import { EIP712TypedData, HexString } from "../../types"
import BaseService from "../base"
import { ServiceCreatorFunction, ServiceLifecycleEvents } from "../types"
import ChainService from "../chain"
import { SigningMethod } from "../../utils/signing"
import { AddressOnNetwork } from "../../accounts"

type SigningErrorReason = "userRejected" | "genericError"
type ErrorResponse = {
  type: "error"
  reason: SigningErrorReason
}

export type TXSignatureResponse =
  | {
      type: "success-tx"
      signedTx: SignedEVMTransaction
    }
  | ErrorResponse

export type SignatureResponse =
  | {
      type: "success-data"
      signedData: string
    }
  | ErrorResponse

type Events = ServiceLifecycleEvents & {
  signingTxResponse: TXSignatureResponse
  signingDataResponse: SignatureResponse
  personalSigningResponse: SignatureResponse
}

type SignerType = "keyring" | HardwareSignerType
type HardwareSignerType = "ledger"

type AddressHandler = {
  address: string
  signer: SignerType
}

type AccountSigner = {
  type: SignerType
  accountID: string
}

function getSigningErrorReason(err: unknown): SigningErrorReason {
  if (err instanceof TransportStatusError) {
    const transportError = err as Error & { statusCode: number }
    switch (transportError.statusCode) {
      case StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED:
        return "userRejected"
      default:
    }
  }

  return "genericError"
}

/**
 * The SigningService is intended hide and demultiplex of accesses
 * to concrete signer implementations.
 *
 * It also emits all the abstract signing-related event to subscribers
 * grabbing this responsibility from each different implementation.
 *
 */
export default class SigningService extends BaseService<Events> {
  addressHandlers: AddressHandler[] = []

  static create: ServiceCreatorFunction<
    Events,
    SigningService,
    [Promise<KeyringService>, Promise<LedgerService>, Promise<ChainService>]
  > = async (keyringService, ledgerService, chainService) => {
    return new this(
      await keyringService,
      await ledgerService,
      await chainService
    )
  }

  private constructor(
    private keyringService: KeyringService,
    private ledgerService: LedgerService,
    private chainService: ChainService
  ) {
    super()
  }

  protected async internalStartService(): Promise<void> {
    await super.internalStartService() // Not needed, but better to stick to the patterns
  }

  async deriveAddress(signerID: AccountSigner): Promise<HexString> {
    if (signerID.type === "ledger") {
      return this.ledgerService.deriveAddress(signerID.accountID)
    }

    if (signerID.type === "keyring") {
      return this.keyringService.deriveAddress(signerID.accountID)
    }

    throw new Error(`Unknown signerID: ${signerID}`)
  }

  private async signTransactionWithNonce(
    transactionWithNonce: EIP1559TransactionRequest & { nonce: number },
    signingMethod: SigningMethod
  ): Promise<SignedEVMTransaction> {
    switch (signingMethod.type) {
      case "ledger":
        return this.ledgerService.signTransaction(
          transactionWithNonce,
          signingMethod.deviceID,
          signingMethod.path
        )
      case "keyring":
        return this.keyringService.signTransaction(
          {
            address: transactionWithNonce.from,
            network: transactionWithNonce.network,
          },
          transactionWithNonce
        )
      default:
        throw new Error(`Unreachable!`)
    }
  }

  async removeAccount(
    address: HexString,
    signingMethod: SigningMethod
  ): Promise<void> {
    switch (signingMethod.type) {
      case "keyring":
        await this.keyringService.hideAccount(address)
        await this.chainService.removeAccountToTrack(address)
        break
      case "ledger":
        // @TODO Implement removal of ledger accounts.
        break
      default:
        throw new Error("Unknown signingMethod type.")
    }
  }

  async signTransaction(
    transactionRequest: EIP1559TransactionRequest,
    signingMethod: SigningMethod
  ): Promise<SignedEVMTransaction> {
    const transactionWithNonce =
      await this.chainService.populateEVMTransactionNonce(transactionRequest)

    try {
      const signedTx = await this.signTransactionWithNonce(
        transactionWithNonce,
        signingMethod
      )

      this.emitter.emit("signingTxResponse", {
        type: "success-tx",
        signedTx,
      })

      return signedTx
    } catch (err) {
      this.emitter.emit("signingTxResponse", {
        type: "error",
        reason: getSigningErrorReason(err),
      })

      this.chainService.releaseEVMTransactionNonce(transactionWithNonce)

      throw err
    }
  }

  addTrackedAddress(address: string, handler: SignerType): void {
    this.addressHandlers.push({ address, signer: handler })
  }

  async signTypedData({
    typedData,
    account,
    signingMethod,
  }: {
    typedData: EIP712TypedData
    account: AddressOnNetwork
    signingMethod: SigningMethod
  }): Promise<string> {
    try {
      let signedData: string
      const chainId =
        typeof typedData.domain.chainId === "string"
          ? // eslint-disable-next-line radix
            parseInt(typedData.domain.chainId)
          : typedData.domain.chainId
      if (
        typedData.domain.chainId !== undefined &&
        // Let parseInt infer radix by prefix; chainID can be hex or decimal,
        // though it should generally be hex.
        // eslint-disable-next-line radix
        chainId !== parseInt(account.network.chainID)
      ) {
        throw new Error(
          "Attempting to sign typed data with mismatched chain IDs."
        )
      }

      switch (signingMethod.type) {
        case "ledger":
          signedData = await this.ledgerService.signTypedData(
            typedData,
            account.address,
            signingMethod.deviceID,
            signingMethod.path
          )
          break
        case "keyring":
          signedData = await this.keyringService.signTypedData({
            typedData,
            account: account.address,
          })
          break
        default:
          throw new Error(`Unreachable!`)
      }
      this.emitter.emit("signingDataResponse", {
        type: "success-data",
        signedData,
      })

      return signedData
    } catch (err) {
      this.emitter.emit("signingDataResponse", {
        type: "error",
        reason: getSigningErrorReason(err),
      })

      throw err
    }
  }

  async signData(
    addressOnNetwork: AddressOnNetwork,
    message: string,
    signingMethod: SigningMethod
  ): Promise<string> {
    this.signData = this.signData.bind(this)
    try {
      let signedData
      switch (signingMethod.type) {
        case "ledger":
          signedData = await this.ledgerService.signMessage(
            addressOnNetwork,
            message
          )
          break
        case "keyring":
          signedData = await this.keyringService.personalSign({
            signingData: message,
            account: addressOnNetwork.address,
          })
          break
        default:
          throw new Error(`Unreachable!`)
      }

      this.emitter.emit("personalSigningResponse", {
        type: "success-data",
        signedData,
      })
      return signedData
    } catch (err) {
      if (err instanceof TransportStatusError) {
        const transportError = err as Error & { statusCode: number }
        switch (transportError.statusCode) {
          case StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED:
            this.emitter.emit("personalSigningResponse", {
              type: "error",
              reason: "userRejected",
            })
            throw err
          default:
            break
        }
      }
      this.emitter.emit("personalSigningResponse", {
        type: "error",
        reason: "genericError",
      })
      throw err
    }
  }
}
