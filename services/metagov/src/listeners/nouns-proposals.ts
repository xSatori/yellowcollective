import { config } from "../config";
import { NounsProposal } from "../types";
import { graphqlRequest } from "../utils/http";

const GET_RECENT_PROPOSALS = `
  query GetRecentProposals($since: BigInt!) {
    proposals(
      where: { createdTimestamp_gt: $since }
      orderBy: createdTimestamp
      orderDirection: asc
    ) {
      id
      title
      description
      proposer {
        id
      }
      startBlock
      endBlock
      createdTimestamp
      status
    }
  }
`;

const GET_PROPOSAL_BY_ID = `
  query GetProposal($id: ID!) {
    proposal(id: $id) {
      id
      title
      description
      proposer {
        id
      }
      startBlock
      endBlock
      createdTimestamp
      status
    }
  }
`;

type NounsProposalResponse = {
  id: string;
  title?: string;
  description?: string;
  proposer?: string | { id?: string };
  startBlock?: string;
  endBlock?: string;
  createdTimestamp?: string;
  status?: string;
};

const normalizeProposal = (raw: NounsProposalResponse): NounsProposal => ({
  id: String(raw.id),
  title: raw.title || `Nouns Proposal ${raw.id}`,
  description: raw.description || "",
  proposer:
    typeof raw.proposer === "string" ? raw.proposer : raw.proposer?.id || "",
  startBlock: String(raw.startBlock || "0"),
  endBlock: String(raw.endBlock || "0"),
  createdTimestamp: String(raw.createdTimestamp || "0"),
  status: raw.status || "UNKNOWN",
});

export const fetchNewProposals = async (sinceTimestamp: number) => {
  const data = await graphqlRequest<{
    proposals: NounsProposalResponse[] | { items?: NounsProposalResponse[] };
  }>(config.nounsGraphqlEndpoint, GET_RECENT_PROPOSALS, {
    since: String(sinceTimestamp),
  });

  const proposals = Array.isArray(data.proposals)
    ? data.proposals
    : data.proposals.items || [];

  return proposals.map(normalizeProposal);
};

export const fetchProposalById = async (id: string) => {
  const data = await graphqlRequest<{
    proposal?: NounsProposalResponse | null;
  }>(config.nounsGraphqlEndpoint, GET_PROPOSAL_BY_ID, { id });

  return data.proposal ? normalizeProposal(data.proposal) : null;
};
