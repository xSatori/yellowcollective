import { getNounsDaoProposalVotes } from "data/nouns-dao/votes";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const proposalNumber = Number(req.query.proposalNumber);

  if (!Number.isFinite(proposalNumber)) {
    return res.status(400).json({ error: "Invalid proposal number." });
  }

  try {
    return res.status(200).json(await getNounsDaoProposalVotes(proposalNumber));
  } catch (error) {
    console.warn("Unable to load Nouns DAO proposal votes", error);
    return res.status(200).json([]);
  }
}
