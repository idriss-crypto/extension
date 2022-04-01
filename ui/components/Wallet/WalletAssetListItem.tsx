import React, { ReactElement } from "react"
import { Link } from "react-router-dom"
import { CompleteAssetAmount } from "@tallyho/tally-background/redux-slices/accounts"

import SharedLoadingSpinner from "../Shared/SharedLoadingSpinner"
import SharedAssetIcon from "../Shared/SharedAssetIcon"

interface Props {
  assetAmount: CompleteAssetAmount
  initializationLoadingTimeExpired: boolean
}

export default function WalletAssetListItem(props: Props): ReactElement {
  const { assetAmount, initializationLoadingTimeExpired } = props

  const isMissingLocalizedUserValue =
    typeof assetAmount.localizedMainCurrencyAmount === "undefined"

  const contractAddress =
    "contractAddress" in assetAmount.asset
      ? assetAmount.asset.contractAddress
      : undefined

  return (
    <li>
      <Link
        to={{
          pathname: "/singleAsset",
          state: assetAmount.asset,
        }}
      >
        <div className="wallet_asset_list_item">
          <div className="left">
            <SharedAssetIcon
              logoURL={assetAmount?.asset?.metadata?.logoURL}
              symbol={assetAmount?.asset?.symbol}
            />
            <div className="left_content">
              <div className="amount">
                <span className="bold_amount_count">
                  {assetAmount.localizedDecimalAmount}
                </span>
                {assetAmount.asset.symbol}
              </div>
              {initializationLoadingTimeExpired &&
              isMissingLocalizedUserValue ? (
                <></>
              ) : (
                <div className="price">
                  {isMissingLocalizedUserValue ? (
                    <SharedLoadingSpinner size="small" />
                  ) : (
                    `$${assetAmount.localizedMainCurrencyAmount}`
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="right">
            <Link
              to={{
                pathname: "/send",
                state: assetAmount.asset,
              }}
              className="asset_list_item_icon asset_list_item_icon_send_asset"
            />
            <Link
              to={{
                pathname: "/swap",
                state: {
                  symbol: assetAmount.asset.symbol,
                  contractAddress,
                },
              }}
              className="asset_list_item_icon asset_list_item_icon_swap_asset"
            />
          </div>
        </div>
      </Link>
      <style jsx>
        {`
          .wallet_asset_list_item {
            height: 72px;
            width: 100%;
            border-radius: 16px;
            background-color: var(--green-95);
            display: flex;
            padding: 16px;
            box-sizing: border-box;
            margin-bottom: 16px;
            justify-content: space-between;
            align-items: center;
          }
          .wallet_asset_list_item:hover {
            background-color: var(--green-80);
          }
          .left {
            display: flex;
          }
          .left_content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-left: 16px;
          }
          .amount {
            height: 17px;
            color: #fefefc;
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
            text-transform: uppercase;
            margin-bottom: 8px;
            margin-top: -1px;
          }
          .bold_amount_count {
            width: 70px;
            height: 24px;
            color: #fefefc;
            font-size: 18px;
            font-weight: 600;
            line-height: 24px;
            margin-right: 4px;
          }
          .price {
            height: 17px;
            display: flex;
            color: var(--green-40);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
          }
          .right {
            display: flex;
            width: 48px;
            justify-content: flex-end;
            margin-right: 16px;
          }
        `}
      </style>
      <style jsx global>
        {`
          .asset_list_item_icon {
            mask-size: cover;
            background-color: var(--green-60);
            width: 12px;
            height: 12px;
          }
          .wallet_asset_list_item:hover .asset_list_item_icon:not(:hover) {
            background-color: var(--green-40);
          }
          .asset_list_item_icon:hover {
            background-color: var(--trophy-gold);
          }
          .asset_list_item_icon_send_asset {
            mask-image: url("./images/send_asset.svg");
          }
          .asset_list_item_icon_swap_asset {
            mask-image: url("./images/swap_asset.svg");
            margin-left: 20px;
          }
        `}
      </style>
    </li>
  )
}
