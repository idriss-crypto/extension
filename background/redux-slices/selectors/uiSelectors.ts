import { createSelector } from "@reduxjs/toolkit"
import { RootState } from ".."
import { ActivityItem } from "../activities"

// FIXME Make this configurable.
const hardcodedMainCurrencySymbol = "USD"

export const selectShowingActivityDetail = createSelector(
  (state: RootState) => state.activities,
  (state: RootState) => state.ui.showingActivityDetailID,
  (activities, showingActivityDetailID) => {
    return showingActivityDetailID === null
      ? null
      : Object.values(activities)
          .map<ActivityItem | undefined>(
            (accountActivities) =>
              accountActivities.entities[showingActivityDetailID]
          )
          // Filter/slice lets us use map after instead of assigning a var.
          .filter(
            (activity): activity is ActivityItem =>
              typeof activity !== "undefined"
          )
          .slice(0, 1)[0]
  }
)

export const selectCurrentAccount = createSelector(
  (state: RootState) => state.ui.selectedAccount,
  ({ address, network }) => ({
    address,
    network,
    truncatedAddress: address.toLowerCase().slice(0, 7),
  })
)

export const selectCurrentAddressNetwork = createSelector(
  (state: RootState) => state.ui.selectedAccount,
  (selectedAccount) => selectedAccount
)

export const selectCurrentNetwork = createSelector(
  (state: RootState) => state.ui.selectedAccount.network,
  (selectedNetwork) => selectedNetwork
)

export const selectMainCurrencySymbol = createSelector(
  () => null,
  () => hardcodedMainCurrencySymbol
)

export const selectMainCurrency = createSelector(
  (state: RootState) => state.ui,
  (state: RootState) => state.assets,
  (state: RootState) => selectMainCurrencySymbol(state),
  (_, assets, mainCurrencySymbol) =>
    assets.find((asset) => asset.symbol === mainCurrencySymbol)
)
