import { createSlice } from "@reduxjs/toolkit"
import { NameOnNetwork } from "../accounts"
import { createBackgroundAsyncThunk } from "./utils"

export type ResolvedIdrissAddressState = {
  address: string
}

export const initialState: ResolvedIdrissAddressState = {
  address: "",
}

const resolveIdrissAddressSlice = createSlice({
  name: "resolveIdrissAddress",
  initialState,
  reducers: {
    setResolvedAddress: (
      immerState,
      { payload: resolvedAddress }: { payload: string }
    ) => {
      immerState.address = resolvedAddress
    },
  },
})

export const { setResolvedAddress } = resolveIdrissAddressSlice.actions

export default resolveIdrissAddressSlice.reducer

export const resolveIdrissAddress = createBackgroundAsyncThunk(
  "domain/resolveDomainAddress",
  async (nameNetwork: NameOnNetwork, { dispatch, extra: { main } }) => {
    const address = await main.resolveIdrissAddress(nameNetwork)
    if (address) {
      dispatch(resolveIdrissAddressSlice.actions.setResolvedAddress(address))
    }
  }
)
