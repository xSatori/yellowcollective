import Layout from "@/components/Layout";
import ProposalPropdates from "@/components/ProposalPropdates";
import ProposalTabs from "@/components/ProposalTabs";
import ProposalTransactions from "@/components/ProposalTransactions";
import ProposalVoteList, { ProposalVote } from "@/components/ProposalVoteList";
import ProposalVoteSummary from "@/components/ProposalVoteSummary";
import { shortenAddress } from "@/utils/shortenAddress";
import {
  getNounsDaoProposalByNumber,
  getNounsDaoProposals,
  type NounsDaoProposal,
} from "data/nouns-dao/proposals";
import { NOUNS_TOKEN_CONTRACT } from "constants/addresses";
import { ETHERSCAN_BASEURL } from "constants/urls";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import type {
  GetStaticPaths,
  GetStaticPropsResult,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useSWR from "swr";

type NounsProposalDetailProps = {
  proposal: NounsDaoProposal;
};

const formatDate = (timestamp: string) =>
  new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const getStatus = (state: number) => {
  switch (state) {
    case 0:
      return { label: "Upcoming", className: "bg-skin-proposal-highlighted" };
    case 9:
      return { label: "Upcoming", className: "bg-skin-proposal-highlighted" };
    case 10:
      return { label: "Upcoming", className: "bg-skin-proposal-highlighted" };
    case 1:
      return { label: "Active", className: "bg-skin-proposal-highlighted" };
    case 2:
      return { label: "Canceled", className: "bg-skin-proposal-muted" };
    case 3:
      return { label: "Defeated", className: "bg-skin-proposal-danger" };
    case 4:
      return { label: "Succeeded", className: "bg-skin-proposal-success" };
    case 5:
      return { label: "Queued", className: "bg-[#ffcc00] text-skin-base" };
    case 6:
      return { label: "Expired", className: "bg-skin-proposal-muted" };
    case 7:
      return { label: "Executed", className: "bg-skin-proposal-success" };
    case 8:
      return { label: "Vetoed", className: "bg-skin-proposal-danger" };
    default:
      return { label: "Unknown", className: "bg-skin-proposal-muted" };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const proposals = await getNounsDaoProposals();

    return {
      paths: proposals.map((proposal) => ({
        params: { proposalNumber: String(proposal.proposalNumber) },
      })),
      fallback: "blocking",
    };
  } catch {
    return {
      paths: [],
      fallback: "blocking",
    };
  }
};

export const getStaticProps = async ({
  params,
}: {
  params?: { proposalNumber?: string };
}): Promise<GetStaticPropsResult<NounsProposalDetailProps>> => {
  try {
    const proposalNumber = Number(params?.proposalNumber);
    const proposal = Number.isFinite(proposalNumber)
      ? await getNounsDaoProposalByNumber(proposalNumber)
      : undefined;

    if (!proposal) return { notFound: true, revalidate: 60 };

    return {
      props: { proposal },
      revalidate: 60,
    };
  } catch (error) {
    console.warn(
      `Unable to load Nouns DAO proposal detail ${params?.proposalNumber}`,
      error
    );
    return { notFound: true, revalidate: 60 };
  }
};

export default function NounsProposalDetailPage({
  proposal,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const status = getStatus(proposal.state);
  const description = getDescriptionWithoutTitle(proposal);
  const forVotes = Number(proposal.forVotes || 0);
  const againstVotes = Number(proposal.againstVotes || 0);
  const abstainVotes = Number(proposal.abstainVotes || 0);
  const { data: proposalVotes, isLoading: proposalVotesLoading } = useSWR<
    ProposalVote[]
  >(`/api/nouns/proposals/${proposal.proposalNumber}/votes`);

  const getVotePercentage = (votes: number) => {
    const total = forVotes + againstVotes + abstainVotes;
    if (!votes || !total) return 0;

    const value = Math.round((votes / total) * 100);
    if (value > 100) return 100;
    return value;
  };

  return (
    <Layout>
      <Head>
        <title>
          Nouns Proposal {proposal.proposalNumber} | Yellow Collective
        </title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-baseline">
            <Link
              href="/proposals/nouns"
              className="mr-4 flex h-10 min-h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-skin-stroke bg-white shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none"
              aria-label="Back to Nouns DAO proposals"
            >
              <ArrowLeftIcon className="h-4 text-skin-base" />
            </Link>

            <div>
              <div className="flex items-center">
                <div className="font-heading text-2xl text-skin-base mr-4 break-words">
                  Nouns DAO Proposals
                </div>
                <div
                  className={`${status.className} w-24 rounded-md p-1 px-2 text-center ${status.className.includes("text-") ? "" : "text-white"}`}
                >
                  {status.label}
                </div>
              </div>
              <h1 className="mt-2 text-5xl font-heading text-skin-base font-semibold">
                {proposal.title}
              </h1>
              <div className="mt-4 text-2xl font-heading text-skin-muted">
                Proposed by{" "}
                <Link
                  href={`${ETHERSCAN_BASEURL}/address/${proposal.proposer}`}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-skin-highlighted underline"
                >
                  {shortenAddress(proposal.proposer)}
                </Link>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-skin-stroke bg-white px-4 py-3 font-heading text-base text-skin-base shadow-[0px_4.02px_0px_0px_#BBB]">
            This page is a work in progress.
          </div>
        </div>

        <ProposalVoteSummary
          votes={[
            {
              label: "For",
              type: "success",
              value: forVotes,
              percentage: getVotePercentage(forVotes),
            },
            {
              label: "Against",
              type: "danger",
              value: againstVotes,
              percentage: getVotePercentage(againstVotes),
            },
            {
              label: "Abstain",
              type: "muted",
              value: abstainVotes,
              percentage: getVotePercentage(abstainVotes),
            },
          ]}
          metrics={[
            {
              label: "Threshold",
              eyebrow: "Current Threshold",
              value: `${proposal.quorumVotes || 1} Quorum`,
            },
            {
              label: "Ends",
              eyebrow: "Block",
              value: proposal.voteEndBlock,
            },
            {
              label: "Snapshot",
              eyebrow: "Block",
              value: proposal.voteStartBlock,
            },
          ]}
        />

        <ProposalTabs
          items={[
            {
              id: "description",
              label: "Description",
              content: (
                <>
                  <section className="rounded-b-2xl rounded-tr-2xl border border-t-0 border-skin-stroke bg-white p-6 shadow-sm md:p-8">
                    <div className="text-2xl font-heading text-skin-base font-bold">
                      Description
                    </div>

                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-skin mt-4 max-w-none break-words prose-headings:font-heading prose-p:text-base prose-p:leading-snug prose-a:text-accent-blue prose-a:underline md:prose-p:text-lg"
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {description}
                    </ReactMarkdown>
                  </section>

                  <ProposalTransactions
                    className="mt-6"
                    transactions={proposal.targets.map((target, index) => ({
                      target,
                      value: proposal.values[index],
                      signature: proposal.signatures[index],
                      calldata: proposal.calldatas[index],
                    }))}
                  />
                </>
              ),
            },
            {
              id: "votes",
              label: "Votes",
              content: (
                <section className="rounded-b-2xl rounded-tr-2xl border border-t-0 border-skin-stroke bg-white p-6 shadow-sm md:p-8">
                  <div className="text-2xl font-heading text-skin-base font-bold">
                    Votes
                  </div>
                  <div className="mt-4">
                    <ProposalVoteList
                      votes={proposalVotes}
                      isLoading={proposalVotesLoading}
                    />
                  </div>
                </section>
              ),
            },
            {
              id: "propdates",
              label: "Propdates",
              content: (
                <ProposalPropdates
                  proposalId={proposal.proposalId}
                  tokenAddress={NOUNS_TOKEN_CONTRACT}
                />
              ),
            },
          ]}
        />
      </div>
    </Layout>
  );
}

const normalizeHeading = (value: string) =>
  value
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .trim()
    .toLowerCase();

const getDescriptionWithoutTitle = (proposal: NounsDaoProposal) => {
  const lines = proposal.description.split("\n");
  let firstContentIndex = lines.findIndex((line) => line.trim());

  if (firstContentIndex === -1) return proposal.description;

  while (
    firstContentIndex !== -1 &&
    normalizeHeading(lines[firstContentIndex].trim()) ===
      normalizeHeading(proposal.title)
  ) {
    lines.splice(firstContentIndex, 1);
    firstContentIndex = lines.findIndex((line) => line.trim());
  }

  return lines.join("\n").trim();
};
