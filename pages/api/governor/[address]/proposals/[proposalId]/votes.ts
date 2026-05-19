import type { NextApiRequest, NextApiResponse } from "next";
import { SUBGRAPH_ENDPOINT } from "constants/urls";
import { GraphQLClient, gql } from "graphql-request";

type ProposalVoteRow = {
  voter: string;
  support: number | string;
  weight: number | string;
  reason?: string | null;
};

const proposalVotesQuery = gql`
  query proposalVotes($proposalId: String!) {
    proposalVotes(
      first: 1000
      where: { proposal: $proposalId }
      orderBy: weight
      orderDirection: desc
    ) {
      voter
      support
      weight
      reason
    }
  }
`;

const normalizeSupport = (value: number | string) => {
  if (typeof value === "number") return value;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) return numericValue;

  switch (value.toLowerCase()) {
    case "against":
      return 0;
    case "for":
      return 1;
    case "abstain":
      return 2;
    default:
      return 2;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const proposalId = String(req.query.proposalId || "").toLowerCase();

  if (!proposalId) {
    return res.status(400).json({ error: "Missing proposal id." });
  }

  try {
    const client = new GraphQLClient(SUBGRAPH_ENDPOINT);
    const data = await client.request<{
      proposalVotes?: ProposalVoteRow[];
    }>(proposalVotesQuery, { proposalId });

    return res.status(200).json(
      (data.proposalVotes || []).map((vote) => ({
        voter: vote.voter,
        support: normalizeSupport(vote.support),
        weight: Number(vote.weight || 0),
        reason: vote.reason || "",
      }))
    );
  } catch (error) {
    console.warn("Unable to load proposal votes", error);
    return res.status(200).json([]);
  }
}
