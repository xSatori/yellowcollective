import type { NextApiRequest, NextApiResponse } from "next";
import {
  getSnapshotProposalForNouns,
  getSnapshotVotes,
  type SnapshotProposal,
  type SnapshotVote,
} from "data/snapshot";
import {
  SNAPSHOT_SPACE_ID,
  SNAPSHOT_SPACE_URL,
  YELLOW_METAGOV_SAFE_ADDRESS,
} from "constants/metagov";

type SnapshotProposalResponse = {
  space: string;
  spaceUrl: string;
  safeAddress: string;
  proposal: SnapshotProposal | null;
  userVote: SnapshotVote | null;
};

const isAddress = (value: unknown) =>
  typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SnapshotProposalResponse | { error: string }>
) {
  const proposalNumber = Number(req.query.proposalNumber);

  if (!Number.isInteger(proposalNumber) || proposalNumber <= 0) {
    return res.status(400).json({ error: "Invalid Nouns proposal number." });
  }

  try {
    const proposal = await getSnapshotProposalForNouns(proposalNumber);
    const voter = isAddress(req.query.voter)
      ? (req.query.voter as string)
      : undefined;
    const votes =
      proposal && voter ? await getSnapshotVotes(proposal.id, voter) : [];

    res.setHeader(
      "Cache-Control",
      "s-maxage=30, stale-while-revalidate=300"
    );
    return res.status(200).json({
      space: SNAPSHOT_SPACE_ID,
      spaceUrl: SNAPSHOT_SPACE_URL,
      safeAddress: YELLOW_METAGOV_SAFE_ADDRESS,
      proposal,
      userVote: votes[0] || null,
    });
  } catch (error) {
    console.error("Unable to load Snapshot metagov proposal", error);
    return res
      .status(500)
      .json({ error: "Unable to load Snapshot metagov proposal." });
  }
}
