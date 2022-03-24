import {createSlice} from "@reduxjs/toolkit"
import {NameOnNetwork} from "../accounts"
import {createBackgroundAsyncThunk} from "./utils"
import {HexString} from "../types";

export type ResolvedIdrissAddressState = {
  name: string,
  allAddresses: { [key: string]: HexString }
}

export const initialState: ResolvedIdrissAddressState = {
  name: "",
  allAddresses: {},
}

const resolveIdrissAddressSlice = createSlice({
  name: "resolveIdrissAddress",
  initialState,
  reducers: {
    setResolvedAddress: (
      immerState,
      {payload}: { payload: ResolvedIdrissAddressState }
    ) => {
      immerState.name = payload.name
      immerState.allAddresses = payload.allAddresses
    },
  },
})

export const {setResolvedAddress} = resolveIdrissAddressSlice.actions

export default resolveIdrissAddressSlice.reducer

export const resolveIdrissAddress = createBackgroundAsyncThunk(
  "idriss/resolveIdrissAddress",
  async (nameNetwork: NameOnNetwork, {dispatch, extra: {main}}) => {
    const data = await main.resolveIdrissAddress(nameNetwork)
    dispatch(resolveIdrissAddressSlice.actions.setResolvedAddress(data))
  }
)
