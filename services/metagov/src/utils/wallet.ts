import { ethers } from "ethers";
import { config } from "../config";

export const getProvider = () => new ethers.JsonRpcProvider(config.ethereumRpcUrl);

export const getBotWallet = () =>
  new ethers.Wallet(config.botPrivateKey, getProvider());

export const getWalletAddress = async () => getBotWallet().getAddress();

export const getCurrentBlockNumber = async () => getProvider().getBlockNumber();
