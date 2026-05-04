export type ProposalStatusLabel =
  | "Pending"
  | "Active"
  | "Passed"
  | "Failed"
  | "Executed";

export type PlaceholderProposal = {
  number: number;
  title: string;
  proposer: string;
  status: ProposalStatusLabel;
  forVotes: string;
  againstVotes: string;
  date: string;
};

export const placeholderProposals: PlaceholderProposal[] = [
  {
    number: 3,
    title: "Fund the next Yellow Collective art sprint",
    proposer: "yellow.eth",
    status: "Active",
    forVotes: "128",
    againstVotes: "12",
    date: "Season 01",
  },
  {
    number: 2,
    title: "Support Superchain creator rewards experiments",
    proposer: "collective",
    status: "Passed",
    forVotes: "211",
    againstVotes: "18",
    date: "Season 01",
  },
  {
    number: 1,
    title: "Seed the first community trait contest",
    proposer: "nounders",
    status: "Executed",
    forVotes: "304",
    againstVotes: "9",
    date: "Launch",
  },
];
