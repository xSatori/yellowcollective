import { ethers } from "ethers";
import { config } from "../config";

export const getProvider = () =>
  new ethers.JsonRpcProvider(
    config.ethereumRpcUrl,
    {
      chainId: 1,
      name: "mainnet",
    },
    {
      batchMaxCount: 1,
      staticNetwork: true,
    }
  );

export const getBotWallet = () =>
  new ethers.Wallet(config.botPrivateKey, getProvider());

export const getWalletAddress = async () => getBotWallet().getAddress();

export const getCurrentBlockNumber = async () => getProvider().getBlockNumber();

export const validateRpcEndpoint = async () => {
  try {
    const blockNumber = await getProvider().getBlockNumber();
    if (!Number.isInteger(blockNumber) || blockNumber <= 0) {
      throw new Error(`Unexpected block number: ${blockNumber}`);
    }
    return blockNumber;
  } catch (error) {
    const detail =
      error instanceof Error ? ` ${error.message}` : " Unknown RPC error.";
    throw new Error(
      `ETHEREUM_RPC_URL is not a working Ethereum mainnet JSON-RPC endpoint: ${config.ethereumRpcUrl}.${detail}`
    );
  }
};
