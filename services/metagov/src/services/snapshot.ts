import { ethers } from "ethers";
import { config, snapshotVotingDuration } from "../config";
import { NounsProposal, SnapshotChoice, SnapshotResult } from "../types";
import { graphqlRequest } from "../utils/http";
import { getBotWallet, getCurrentBlockNumber } from "../utils/wallet";

const snapshotDomain = { name: "snapshot", version: "0.1.4" };

const proposalTypes = {
  Proposal: [
    { name: "from", type: "string" },
    { name: "space", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "type", type: "string" },
    { name: "title", type: "string" },
    { name: "body", type: "string" },
    { name: "discussion", type: "string" },
    { name: "choices", type: "string[]" },
    { name: "labels", type: "string[]" },
    { name: "start", type: "uint64" },
    { name: "end", type: "uint64" },
    { name: "snapshot", type: "uint64" },
    { name: "plugins", type: "string" },
    { name: "privacy", type: "string" },
    { name: "app", type: "string" },
  ],
};

const cancelProposalTypes = {
  CancelProposal: [
    { name: "from", type: "string" },
    { name: "space", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "proposal", type: "string" },
  ],
};

const GET_SPACE_PROPOSALS = `
  query SpaceProposals($space: String!) {
    proposals(where: { space: $space }, first: 100, orderBy: "created", orderDirection: desc) {
      id
      title
      state
      end
    }
  }
`;

const GET_FILTERED_PROPOSALS = `
  query FilteredProposals($space: String!, $state: String!) {
    proposals(where: { space: $space, state: $state }, first: 100, orderBy: "end", orderDirection: asc) {
      id
      title
      state
      end
    }
  }
`;

const GET_PROPOSAL_RESULTS = `
  query ProposalResults($id: String!) {
    proposal(id: $id) {
      id
      title
      state
      choices
      scores
      scores_total
    }
    votes(where: { proposal: $id }, first: 1000, orderBy: "vp", orderDirection: desc) {
      voter
      choice
      vp
      reason
    }
  }
`;

type SnapshotProposalLite = {
  id: string;
  title: string;
  state?: string;
  end?: number;
};

type SnapshotVote = {
  voter: string;
  choice: number;
  vp: number;
  reason?: string;
};

export type ActiveSnapshotProposal = {
  snapshotId: string;
  nounsId: string;
  title: string;
  endsAt: number;
};

export type SnapshotProposalReceipt = {
  id: string;
  ipfs?: string;
};

const parseNounsIdFromTitle = (title: string) => {
  const directMatch = title.match(/^(\d+)\s*:/);
  if (directMatch) return directMatch[1];

  const nounsMatch = title.match(/^Nouns\s*#?(\d+)\s*:/i);
  if (nounsMatch) return nounsMatch[1];

  return null;
};

const snapshotProposalUrl = (snapshotId: string) =>
  `https://snapshot.box/#/s:${config.snapshotSpaceId}/proposal/${snapshotId}`;

const postSnapshotEnvelope = async (
  address: string,
  sig: string,
  data: Record<string, unknown>
) => {
  const response = await fetch(config.snapshotSequencer, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address, sig, data }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error_description ||
        payload?.message ||
        `Snapshot sequencer rejected request: ${response.status}`
    );
  }

  return payload;
};

export const formatProposalBody = (proposal: NounsProposal) => {
  const nounsLink = config.proposalLinkTemplate.replace("{id}", proposal.id);
  const siteLink = config.siteProposalLinkTemplate.replace("{id}", proposal.id);

  return [
    `**Nouns proposal:** ${nounsLink}`,
    `**Yellow Collective voting page:** ${siteLink}`,
    "",
    "Vote here to decide how Yellow Collective should vote on the Nouns DAO proposal.",
  ].join("\n");
};

export const createSnapshotProposal = async (
  proposal: NounsProposal
): Promise<SnapshotProposalReceipt> => {
  const wallet = getBotWallet();
  const now = Math.floor(Date.now() / 1000);
  const snapshotBlock = await getCurrentBlockNumber();
  const message = {
    from: wallet.address,
    space: config.snapshotSpaceId,
    timestamp: now,
    type: "single-choice",
    title: `${proposal.id}: ${proposal.title}`,
    body: formatProposalBody(proposal),
    discussion: config.proposalLinkTemplate.replace("{id}", proposal.id),
    choices: ["For", "Against", "Abstain"],
    labels: [] as string[],
    start: now,
    end: now + snapshotVotingDuration(),
    snapshot: snapshotBlock,
    plugins: "{}",
    privacy: "",
    app: "yellowcollective",
  };

  if (config.dryRun) {
    console.log("[DRY RUN] Would create Snapshot proposal", message);
    return { id: `dry-run-${proposal.id}`, ipfs: "" };
  }

  const sig = await wallet.signTypedData(snapshotDomain, proposalTypes, message);
  const receipt = await postSnapshotEnvelope(wallet.address, sig, {
    domain: snapshotDomain,
    types: proposalTypes,
    message,
  });

  return receipt as SnapshotProposalReceipt;
};

export const getExistingProposalIds = async () => {
  const data = await graphqlRequest<{ proposals: SnapshotProposalLite[] }>(
    config.snapshotGraphql,
    GET_SPACE_PROPOSALS,
    { space: config.snapshotSpaceId }
  );

  return new Set(
    data.proposals
      .map((proposal) => parseNounsIdFromTitle(proposal.title))
      .filter((id): id is string => Boolean(id))
  );
};

const getFilteredSnapshotProposals = async (state: "active" | "closed") => {
  const data = await graphqlRequest<{ proposals: SnapshotProposalLite[] }>(
    config.snapshotGraphql,
    GET_FILTERED_PROPOSALS,
    { space: config.snapshotSpaceId, state }
  );

  return data.proposals
    .map((proposal) => {
      const nounsId = parseNounsIdFromTitle(proposal.title);
      if (!nounsId) return null;
      return {
        snapshotId: proposal.id,
        nounsId,
        title: proposal.title,
        endsAt: Number(proposal.end || 0),
      };
    })
    .filter((proposal): proposal is ActiveSnapshotProposal =>
      Boolean(proposal)
    );
};

export const getActiveSnapshotProposals = () =>
  getFilteredSnapshotProposals("active");

export const getClosedSnapshotProposals = () =>
  getFilteredSnapshotProposals("closed");

export const getSnapshotResults = async (snapshotId: string) => {
  const data = await graphqlRequest<{
    proposal?: {
      state: string;
      scores?: number[];
      scores_total?: number;
    } | null;
  }>(config.snapshotGraphql, GET_PROPOSAL_RESULTS, { id: snapshotId });

  const proposal = data.proposal;
  if (!proposal || proposal.state !== "closed") return null;

  const scores = proposal.scores || [0, 0, 0];
  const [forVotes = 0, againstVotes = 0, abstainVotes = 0] = scores;
  const maxVotes = Math.max(forVotes, againstVotes, abstainVotes);

  if (maxVotes === 0) return "NO_VOTES" as SnapshotResult;

  const winners = [
    ["FOR", forVotes],
    ["AGAINST", againstVotes],
    ["ABSTAIN", abstainVotes],
  ].filter(([, score]) => score === maxVotes);

  if (winners.length > 1) return "ABSTAIN" as SnapshotChoice;

  return winners[0][0] as SnapshotChoice;
};

export const getSnapshotScores = async (snapshotId: string) => {
  const data = await graphqlRequest<{
    proposal?: {
      scores?: number[];
      scores_total?: number;
      state: string;
    } | null;
  }>(config.snapshotGraphql, GET_PROPOSAL_RESULTS, { id: snapshotId });

  return {
    scores: data.proposal?.scores || [0, 0, 0],
    scoresTotal: Number(data.proposal?.scores_total || 0),
  };
};

export const cancelSnapshotProposal = async (snapshotId: string) => {
  const wallet = getBotWallet();
  const message = {
    from: wallet.address,
    space: config.snapshotSpaceId,
    timestamp: Math.floor(Date.now() / 1000),
    proposal: snapshotId,
  };

  if (config.dryRun) {
    console.log(`[DRY RUN] Would cancel Snapshot proposal ${snapshotId}`);
    return true;
  }

  const sig = await wallet.signTypedData(
    snapshotDomain,
    cancelProposalTypes,
    message
  );
  await postSnapshotEnvelope(wallet.address, sig, {
    domain: snapshotDomain,
    types: cancelProposalTypes,
    message,
  });
  return true;
};

export const formatVoteReason = async (snapshotId: string) => {
  const data = await graphqlRequest<{
    proposal?: {
      state: string;
      scores?: number[];
    } | null;
    votes: SnapshotVote[];
  }>(config.snapshotGraphql, GET_PROPOSAL_RESULTS, { id: snapshotId });

  if (!data.proposal || data.proposal.state !== "closed") return null;

  const scores = data.proposal.scores || [0, 0, 0];
  const [forScore = 0, againstScore = 0, abstainScore = 0] = scores;
  const maxScore = Math.max(forScore, againstScore, abstainScore);
  const choice: SnapshotChoice =
    maxScore === 0 || maxScore === abstainScore
      ? "ABSTAIN"
      : maxScore === forScore
        ? "FOR"
        : "AGAINST";

  const byChoice: Record<number, SnapshotVote[]> = { 1: [], 2: [], 3: [] };
  for (const vote of data.votes || []) {
    if (byChoice[vote.choice]) byChoice[vote.choice].push(vote);
  }

  const sections = [
    ["FOR", forScore, byChoice[1]],
    ["AGAINST", againstScore, byChoice[2]],
    ["ABSTAIN", abstainScore, byChoice[3]],
  ] as const;

  const reason = sections
    .map(([label, score, votes]) => {
      const lines = [`**${label} ${Math.round(score)} VOTES**`, ""];
      for (const vote of votes) {
        const voter = `${vote.voter.slice(0, 6)}...${vote.voter.slice(-4)}`;
        lines.push(
          vote.reason?.trim()
            ? `**${voter}** | *"${vote.reason.trim()}"*`
            : `**${voter}**`
        );
        lines.push("");
      }
      return lines.join("\n");
    })
    .join("\n");

  return { choice, reason: reason.trim() };
};

export const getSnapshotUrl = snapshotProposalUrl;
