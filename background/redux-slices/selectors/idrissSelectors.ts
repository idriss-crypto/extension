import { createSelector } from "@reduxjs/toolkit"
import { RootState } from ".."

const selectResolvedIdrissAddress = createSelector(
  (state: RootState) => state.resolvedIdrissAddress,
  (resolvedIdrissAddress) => resolvedIdrissAddress
)

export default selectResolvedIdrissAddress
