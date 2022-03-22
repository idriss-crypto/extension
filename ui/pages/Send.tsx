import React, { ReactElement, useCallback, useEffect, useState } from "react"
import { isAddress } from "@ethersproject/address"
import {
  selectCurrentAccount,
  selectCurrentAccountBalances,
  selectMainCurrencySymbol,
} from "@tallyho/tally-background/redux-slices/selectors"
import {
  broadcastOnSign,
  NetworkFeeSettings,
  selectEstimatedFeesPerGas,
  setFeeType,
  updateTransactionOptions,
} from "@tallyho/tally-background/redux-slices/transaction-construction"
import { utils } from "ethers"
import {
  FungibleAsset,
  isFungibleAssetAmount,
} from "@tallyho/tally-background/assets"
import { ETH } from "@tallyho/tally-background/constants"
import {
  convertFixedPointNumber,
  parseToFixedPointNumber,
} from "@tallyho/tally-background/lib/fixed-point"
import { selectAssetPricePoint } from "@tallyho/tally-background/redux-slices/assets"
import { CompleteAssetAmount } from "@tallyho/tally-background/redux-slices/accounts"
import { enrichAssetAmountWithMainCurrencyValues } from "@tallyho/tally-background/redux-slices/utils/asset-utils"
import NetworkSettingsChooser from "../components/NetworkFees/NetworkSettingsChooser"
import SharedAssetInput from "../components/Shared/SharedAssetInput"
import SharedBackButton from "../components/Shared/SharedBackButton"
import SharedButton from "../components/Shared/SharedButton"
import { useBackgroundDispatch, useBackgroundSelector } from "../hooks"
import SharedSlideUpMenu from "../components/Shared/SharedSlideUpMenu"
import FeeSettingsButton from "../components/NetworkFees/FeeSettingsButton"
import {checkIfStringIsValidIdrissName} from "@tallyho/tally-background/lib/utils";
import { ETHEREUM } from "@tallyho/tally-background/constants/networks"
import {setResolvedAddress} from "@tallyho/tally-background/redux-slices/idriss-resolver";
import selectResolvedIdrissAddress from "@tallyho/tally-background/redux-slices/selectors/idrissSelectors";
import {
  resolveIdrissAddress,
  setResolvedIdrissAddress,
} from "@tallyho/tally-background/redux-slices/idriss-resolver"

export default function Send(): ReactElement {
  const [selectedAsset, setSelectedAsset] = useState<FungibleAsset>(ETH)
  const [destinationAddress, setDestinationAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [gasLimit, setGasLimit] = useState("")
  const [hasError, setHasError] = useState(false)
  const [networkSettingsModalOpen, setNetworkSettingsModalOpen] =
    useState(false)

  const estimatedFeesPerGas = useBackgroundSelector(selectEstimatedFeesPerGas)

  const dispatch = useBackgroundDispatch()
  const currentAccount = useBackgroundSelector(selectCurrentAccount)
  const balanceData = useBackgroundSelector(selectCurrentAccountBalances)
  const mainCurrencySymbol = useBackgroundSelector(selectMainCurrencySymbol)
  const resolvedIdrissAddress = useBackgroundSelector(selectResolvedIdrissAddress)

  // On changing the input text, resolve the domain name if entered
  const handleAddressInputChange = useCallback(
    (value: string) => {
      const trimmedAddress = value.trim()
      if (checkIfStringIsValidIdrissName(trimmedAddress)) {
        const nameNetwork = {
          name: trimmedAddress,
          network: ETHEREUM,
        }
        // try to resolve the domain
        dispatch(resolveIdrissAddress(nameNetwork))
      } else if (isAddress(trimmedAddress)) {
        setDestinationAddress(trimmedAddress)
      } else {
        setHasError(true)
      }
    },
    [dispatch]
  )

  useEffect(() => {
    console.log({resolvedIdrissAddress})
    if (resolvedIdrissAddress.address) {
      if (isAddress(resolvedIdrissAddress.address)) {
        // Set the destination address
        setDestinationAddress(resolvedIdrissAddress.address)
        // Clear the error flag
        setHasError(false)
        // Reset the resolved address to an empty string
        dispatch(setResolvedAddress(""))
      }
    }
  }, [dispatch, resolvedIdrissAddress.address])

  const fungibleAssetAmounts =
    // Only look at fungible assets.
    balanceData?.assetAmounts?.filter(
      (assetAmount): assetAmount is CompleteAssetAmount<FungibleAsset> =>
        isFungibleAssetAmount(assetAmount)
    )
  const assetPricePoint = useBackgroundSelector((state) =>
    selectAssetPricePoint(
      state.assets,
      selectedAsset.symbol,
      mainCurrencySymbol
    )
  )

  const assetAmountFromForm = () => {
    const fixedPointAmount = parseToFixedPointNumber(amount.toString())
    if (typeof fixedPointAmount === "undefined") {
      return undefined
    }

    const decimalMatched = convertFixedPointNumber(
      fixedPointAmount,
      selectedAsset.decimals
    )

    return enrichAssetAmountWithMainCurrencyValues(
      {
        asset: selectedAsset,
        amount: decimalMatched.amount,
      },
      assetPricePoint,
      2
    )
  }

  const assetAmount = assetAmountFromForm()

  const sendTransactionRequest = async () => {
    dispatch(broadcastOnSign(true))
    const transaction = {
      from: currentAccount.address,
      to: destinationAddress,
      // eslint-disable-next-line no-underscore-dangle
      value: BigInt(utils.parseEther(amount?.toString())._hex),
      gasLimit: BigInt(gasLimit),
    }
    return dispatch(updateTransactionOptions(transaction))
  }

  const networkSettingsSaved = (networkSetting: NetworkFeeSettings) => {
    setGasLimit(networkSetting.gasLimit)
    dispatch(setFeeType(networkSetting.feeType))
    setNetworkSettingsModalOpen(false)
  }

  return (
    <>
      <div className="standard_width">
        <div className="back_button_wrap">
          <SharedBackButton />
        </div>
        <h1 className="header">
          <span className="icon_activity_send_medium" />
          <div className="title">Send Asset</div>
        </h1>
        <div className="form">
          <div className="form_input">
            <SharedAssetInput
              label="Asset / Amount"
              onAssetSelect={setSelectedAsset}
              assetsAndAmounts={fungibleAssetAmounts}
              onAmountChange={(value, errorMessage) => {
                setAmount(value)
                if (errorMessage) {
                  setHasError(true)
                } else {
                  setHasError(false)
                }
              }}
              selectedAsset={selectedAsset}
              amount={amount}
              disableDropdown
            />
            <div className="value">
              ${assetAmount?.localizedMainCurrencyAmount ?? "-"}
            </div>
          </div>
          <div className="form_input send_to_field">
            <label htmlFor="send_address">Send To:</label>
            <input
              id="send_address"
              type="text"
              placeholder="0x..."
              spellCheck={false}
              onChange={(event) => handleAddressInputChange(event.target.value)}
            />
          </div>
          <SharedSlideUpMenu
            size="custom"
            isOpen={networkSettingsModalOpen}
            close={() => setNetworkSettingsModalOpen(false)}
            customSize="488px"
          >
            <NetworkSettingsChooser
              estimatedFeesPerGas={estimatedFeesPerGas}
              onNetworkSettingsSave={networkSettingsSaved}
            />
          </SharedSlideUpMenu>
          <div className="network_fee">
            <p>Estimated network fee</p>
            <FeeSettingsButton
              onClick={() => setNetworkSettingsModalOpen(true)}
            />
          </div>
          <div className="divider" />
          <div className="send_footer standard_width_padded">
            <SharedButton
              type="primary"
              size="large"
              isDisabled={
                Number(amount) === 0 ||
                !isAddress(destinationAddress) ||
                hasError
              }
              linkTo={{
                pathname: "/sign-transaction",
                state: {
                  redirectTo: {
                    path: "/singleAsset",
                    state: { symbol: selectedAsset.symbol },
                  },
                },
              }}
              onClick={sendTransactionRequest}
            >
              Send
            </SharedButton>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .icon_activity_send_medium {
            background: url("./images/activity_send_medium@2x.png");
            background-size: 24px 24px;
            width: 24px;
            height: 24px;
            margin-right: 8px;
          }
          .title {
            width: 113px;
            height: 32px;
            color: #ffffff;
            font-size: 22px;
            font-weight: 500;
            line-height: 32px;
          }
          .back_button_wrap {
            position: absolute;
            margin-left: -1px;
            margin-top: -4px;
            z-index: 10;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
            margin-top: 30px;
          }
          .form_input {
            margin-bottom: 22px;
          }

          .label_right {
            margin-right: 6px;
          }
          .divider {
            width: 384px;
            border-bottom: 1px solid #000000;
            margin-left: -16px;
          }
          .label {
            margin-bottom: 6px;
          }
          .value {
            display: flex;
            justify-content: flex-end;
            position: relative;
            top: -24px;
            right: 16px;
            color: var(--green-60);
            font-size: 12px;
            line-height: 16px;
          }
          div.send_to_field {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: space-between;
          }
          div.send_to_field label {
            color: var(--green-40);
            text-align: right;
            font-size: 14px;
          }
          input#send_address {
            box-sizing: border-box;
            height: 72px;
            width: 100%;

            font-size: 22px;
            font-weight: 500;
            line-height: 72px;
            color: #fff;

            border-radius: 4px;
            background-color: var(--green-95);
            padding: 0px 16px;
          }
          .send_footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 21px;
            padding-bottom: 20px;
          }
          .network_fee {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        `}
      </style>
    </>
  )
}
