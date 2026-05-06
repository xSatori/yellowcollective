import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { mainnet, goerli, configureChains, createClient } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { zoraTestnet, zora, base, baseGoerli } from "@wagmi/chains";

import { createPublicClient, fallback, http } from "viem";
import { baseSepolia, mainnet as mainnetViem } from "viem/chains";
import { TOKEN_NETWORK } from "constants/addresses";

const selectedChain = {
  "1": mainnet,
  "5": goerli,
  "999": zoraTestnet,
  "7777777": zora,
  "8453": base,
  "84531": baseGoerli,
  "84532": baseSepolia,
}[TOKEN_NETWORK]!;

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
const CONFIGURED_MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL || process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
const getAlchemyUrl = (baseUrl: string, fallbackUrl: string) =>
  ALCHEMY_KEY ? `${baseUrl}/${ALCHEMY_KEY}` : fallbackUrl;

const MAINNET_RPC_URLS = Array.from(
  new Set(
    [
      CONFIGURED_MAINNET_RPC_URL,
      ALCHEMY_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : "",
      "https://eth.llamarpc.com",
      "https://ethereum.publicnode.com",
      "https://cloudflare-eth.com",
    ].filter((url): url is string => Boolean(url))
  )
);

export const RPC_URLS: { [chainId: string]: string } = {
  "1": MAINNET_RPC_URLS[0],
  "5": getAlchemyUrl(
    "https://eth-goerli.g.alchemy.com/v2",
    "https://ethereum-goerli.publicnode.com"
  ),
  "999": "https://testnet.rpc.zora.energy",
  "7777777": "https://rpc.zora.energy",
  "8453": getAlchemyUrl(
    "https://base-mainnet.g.alchemy.com/v2",
    "https://mainnet.base.org"
  ),
  "84531": getAlchemyUrl(
    "https://base-goerli.g.alchemy.com/v2",
    "https://goerli.base.org"
  ),
  "84532": getAlchemyUrl(
    "https://base-sepolia.g.alchemy.com/v2",
    "https://sepolia.base.org"
  ),
};

export const MAINNET_RPC_URL = RPC_URLS["1"];
export const RPC_URL = RPC_URLS[TOKEN_NETWORK]!;

export type ChainId =
  | "1"
  | "5"
  | "999"
  | "7777777"
  | "8453"
  | "84531"
  | "84532";

const { chains, provider } = configureChains(
  [selectedChain],
  [
    jsonRpcProvider({
      rpc: (_) => {
        return { http: RPC_URL };
      },
      stallTimeout: 1000,
    }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "Yellow Collective",
  chains,
  projectId: "afb449b5b1ea52d11db1ec72bc452500",
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const viemMainnetClient = createPublicClient({
  chain: mainnetViem,
  transport: fallback(
    MAINNET_RPC_URLS.map((url) =>
      http(url, {
        timeout: 4000,
      })
    ),
    {
      retryCount: 1,
    }
  ),
});

export { wagmiClient, chains, viemMainnetClient };
