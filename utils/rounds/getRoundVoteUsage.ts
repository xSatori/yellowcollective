import { getRoundVoteUsage as getRoundVoteUsageFromDb } from "data/rounds";
import { getAddress, isAddress } from "viem";

export const getRoundVoteUsage = async ({
  roundId,
  walletAddress,
}: {
  roundId: string;
  walletAddress: string;
}) => {
  if (!isAddress(walletAddress)) {
    throw new Error("Invalid wallet address.");
  }

  return getRoundVoteUsageFromDb(roundId, getAddress(walletAddress));
};
