import Layout from "@/components/Layout";
import { getProposalName } from "@/utils/getProposalName";
import { TOKEN_CONTRACT } from "constants/addresses";
import { ETHERSCAN_BASEURL, SUBGRAPH_ENDPOINT } from "constants/urls";
import type { GetStaticPropsResult, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { GraphQLClient, gql } from "graphql-request";

type ProposalListItem = {
  proposalId: string;
  proposalNumber: number;
  title?: string | null;
  description?: string | null;
  timeCreated: string;
  voteStart: string;
  voteEnd: string;
  queued: boolean;
  executed: boolean;
  canceled: boolean;
  vetoed: boolean;
  forVotes: number;
  againstVotes: number;
  quorumVotes: string;
  transactionHash: string;
};

type ProposalsPageProps = {
  proposals: ProposalListItem[];
};

const proposalQuery = gql`
  query yellowCollectiveProposals($tokenAddress: String!) {
    daos(first: 1, where: { tokenAddress: $tokenAddress }) {
      proposals(first: 100, orderBy: proposalNumber, orderDirection: desc) {
        proposalId
        proposalNumber
        title
        description
        timeCreated
        voteStart
        voteEnd
        queued
        executed
        canceled
        vetoed
        forVotes
        againstVotes
        quorumVotes
        transactionHash
      }
    }
  }
`;

const getTimestamp = (value: string) => Number(value || 0);

const formatDate = (timestamp: string) => {
  const value = getTimestamp(timestamp);
  if (!value) return "";

  return new Date(value * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getDaysFromNow = (timestamp: string, futurePrefix: string) => {
  const value = getTimestamp(timestamp);
  if (!value) return "";

  const diff = value * 1000 - Date.now();
  const days = Math.max(1, Math.round(Math.abs(diff) / 86400000));

  if (diff >= 0) {
    return days === 1
      ? `${futurePrefix} in 1 day`
      : `${futurePrefix} in ${days} days`;
  }

  return days === 1 ? "1 day ago" : `${days} days ago`;
};

const getTitle = (proposal: ProposalListItem) => {
  const source = proposal.title || proposal.description || "Untitled proposal";

  try {
    const parsed = JSON.parse(source) as { title?: string };
    if (parsed.title) return parsed.title;
  } catch {
    // Proposal titles may be plain strings or JSON metadata.
  }

  return getProposalName(source);
};

const getStatus = (proposal: ProposalListItem) => {
  const now = Date.now() / 1000;
  const quorumVotes = Number(proposal.quorumVotes || 0);

  if (proposal.vetoed) {
    return { label: "Vetoed", className: "border-red-200 text-red-600" };
  }
  if (proposal.canceled) {
    return {
      label: "Cancelled",
      className: "border-skin-stroke text-secondary",
    };
  }
  if (proposal.executed) {
    return { label: "Executed", className: "border-blue-100 text-accent-blue" };
  }
  if (proposal.queued) {
    return { label: "Queued", className: "border-purple-200 text-purple-500" };
  }
  if (now < getTimestamp(proposal.voteStart)) {
    return { label: "Pending", className: "border-yellow-200 text-yellow-600" };
  }
  if (now <= getTimestamp(proposal.voteEnd)) {
    return {
      label: "Active",
      className: "border-emerald-200 text-emerald-600",
    };
  }
  if (
    proposal.forVotes > proposal.againstVotes &&
    proposal.forVotes >= quorumVotes
  ) {
    return {
      label: "Succeeded",
      className: "border-emerald-200 text-emerald-600",
    };
  }
  return { label: "Defeated", className: "border-red-200 text-red-600" };
};

const getTimingLabel = (proposal: ProposalListItem) => {
  const now = Date.now() / 1000;

  if (now <= getTimestamp(proposal.voteEnd)) {
    return getDaysFromNow(proposal.voteEnd, "Ends");
  }
  if (proposal.queued) {
    return getDaysFromNow(proposal.voteEnd, "Expires");
  }
  if (proposal.executed) {
    return getDaysFromNow(proposal.timeCreated, "Created");
  }
  return "";
};

export const getStaticProps = async (): Promise<
  GetStaticPropsResult<ProposalsPageProps>
> => {
  try {
    const client = new GraphQLClient(SUBGRAPH_ENDPOINT);
    const response = await client.request<{
      daos: { proposals: ProposalListItem[] }[];
    }>(proposalQuery, {
      tokenAddress: TOKEN_CONTRACT.toLowerCase(),
    });

    return {
      props: {
        proposals: response.daos[0]?.proposals || [],
      },
      revalidate: 60,
    };
  } catch (error) {
    console.warn("Unable to load proposals", error);

    return {
      props: { proposals: [] },
      revalidate: 60,
    };
  }
};

export default function ProposalsPage({
  proposals,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>Proposals | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 pb-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[36px] leading-none md:text-[44px]">Proposals</h1>
          <Link
            href="/create-proposal"
            className="rounded-xl bg-skin-base px-6 py-3 font-heading text-lg leading-none text-skin-inverted shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:text-xl"
          >
            Create proposal
          </Link>
        </div>

        <div className="flex flex-col gap-5">
          {proposals.length > 0 ? (
            proposals.map((proposal) => (
              <ProposalRow key={proposal.proposalId} proposal={proposal} />
            ))
          ) : (
            <div className="rounded-2xl border border-skin-stroke bg-skin-muted p-8 text-base text-secondary md:text-lg">
              No proposals found.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const ProposalRow = ({ proposal }: { proposal: ProposalListItem }) => {
  const status = getStatus(proposal);
  const timingLabel = getTimingLabel(proposal);

  return (
    <a
      href={`${ETHERSCAN_BASEURL}/tx/${proposal.transactionHash}`}
      target="_blank"
      rel="noreferrer"
      className="grid min-h-[96px] grid-cols-[44px_1fr] items-center gap-4 rounded-2xl border border-skin-stroke bg-skin-muted p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-md md:grid-cols-[44px_1fr_auto]"
    >
      <div className="font-heading text-2xl text-secondary">
        {proposal.proposalNumber}
      </div>

      <div className="min-w-0">
        <h2 className="truncate font-heading text-2xl leading-none text-skin-base md:text-3xl">
          {getTitle(proposal)}
        </h2>
        <div className="mt-3 text-base text-secondary md:text-lg">
          {formatDate(proposal.timeCreated)}
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-start gap-5 md:col-span-1 md:justify-end">
        {timingLabel && (
          <div className="hidden text-base text-secondary sm:block md:text-lg">
            {timingLabel}
          </div>
        )}
        <div
          className={`rounded-full border bg-skin-muted px-4 py-2 font-heading text-base md:text-lg ${status.className}`}
        >
          {status.label}
        </div>
      </div>
    </a>
  );
};
