import type { Round } from "data/rounds";
import { getCollectiveNounVotingPower } from "./getCollectiveNounVotingPower";

export const getRoundVotingPower = async (
  round: Pick<Round, "votingStrategy" | "votesPerWallet" | "votingSnapshotBlock">,
  walletAddress: string
) => {
  if (round.votingStrategy === "one_per_wallet") return 1;
  if (round.votingStrategy === "fixed_per_wallet") return round.votesPerWallet;

  return getCollectiveNounVotingPower(
    walletAddress,
    round.votingSnapshotBlock || undefined
  );
};
