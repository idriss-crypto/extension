import { ETHEREUM, USD } from "../../constants"
import { storageGatewayURL } from "../../lib/storage-gateway"
import { Preferences } from "./types"

const defaultPreferences: Preferences = {
  tokenLists: {
    autoUpdate: false,
    urls: [
      storageGatewayURL(
        new URL(
          "ipfs://bafybeicovpqvb533alo5scf7vg34z6fjspdytbzsa2es2lz35sw3ksh2la"
        )
      ).href, // the Tally community-curated list
      "https://gateway.ipfs.io/ipns/tokens.uniswap.org", // the Uniswap default list
      "https://meta.yearn.finance/api/tokens/list", // the Yearn list
      "https://messari.io/tokenlist/messari-verified", // Messari-verified projects
      "https://wrapped.tokensoft.eth.link", // Wrapped tokens
      "https://tokenlist.aave.eth.link", // Aave-listed tokens and interest-bearing assets
      "https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json", // Compound-listed tokens and interest-bearing assets
      "https://api-polygon-tokens.polygon.technology/tokenlists/default.tokenlist.json", // Polygon Default Tokens
    ],
  },
  currency: USD,
  defaultWallet: true,
  selectedAccount: {
    address: "",
    network: ETHEREUM,
  },
}

export default defaultPreferences
