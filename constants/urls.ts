import { base, baseGoerli } from "@wagmi/chains";
import { TOKEN_NETWORK } from "constants/addresses";

export const ETHERSCAN_BASEURL = {
  "1": "https://etherscan.io",
  "5": "https://goerli.etherscan.io",
  "999": "https://explorer.zora.energy/",
  "7777777": "https://testnet.explorer.zora.energy/",
  "8453": base.blockExplorers.etherscan.url,
  "84531": baseGoerli.blockExplorers.etherscan.url,
}[TOKEN_NETWORK];

export const SUBGRAPH_ENDPOINT = {
  "1": "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-ethereum-mainnet/latest/gn",
  "5": "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-ethereum-sepolia/latest/gn",
  "999":
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-zora-mainnet/latest/gn",
  "7777777":
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-zora-sepolia/latest/gn",
  "8453":
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-base-mainnet/latest/gn",
  "84531":
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-base-sepolia/latest/gn",
}[TOKEN_NETWORK]!;

export const ETHER_ACTOR_BASEURL = "https://ether.actor";
export const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

export const FARCASTER_URL = "https://warpcast.com/~/channel/yellow";
