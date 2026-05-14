import Layout from "@/components/Layout";
import {
  getNounsDaoProposals,
  type NounsDaoProposal,
} from "data/nouns-dao/proposals";
import type { GetStaticPropsResult, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";

type NounsProposalsPageProps = {
  proposals: Omit<NounsDaoProposal, "description">[];
  latestBlock: number;
};

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

const getDaysFromTimestamp = (timestamp: string) => {
  const value = getTimestamp(timestamp);
  if (!value) return "";

  const diff = Date.now() - value * 1000;
  const days = Math.max(1, Math.round(diff / 86400000));
  return days === 1 ? "1 day ago" : `${days} days ago`;
};

const getStatus = (state: number) => {
  switch (state) {
    case 0:
      return {
        label: "Upcoming",
        className: "bg-skin-proposal-highlighted",
      };
    case 9:
      return {
        label: "Upcoming",
        className: "bg-skin-proposal-highlighted",
      };
    case 10:
      return {
        label: "Upcoming",
        className: "bg-skin-proposal-highlighted",
      };
    case 1:
      return {
        label: "Active",
        className: "bg-skin-proposal-highlighted",
      };
    case 2:
      return {
        label: "Canceled",
        className: "bg-skin-proposal-muted",
      };
    case 3:
      return { label: "Defeated", className: "bg-skin-proposal-danger" };
    case 4:
      return {
        label: "Succeeded",
        className: "bg-skin-proposal-success",
      };
    case 5:
      return {
        label: "Queued",
        className: "bg-[#ffcc00] text-skin-base",
      };
    case 6:
      return {
        label: "Expired",
        className: "bg-skin-proposal-muted",
      };
    case 7:
      return {
        label: "Executed",
        className: "bg-skin-proposal-success",
      };
    case 8:
      return { label: "Vetoed", className: "bg-skin-proposal-danger" };
    default:
      return {
        label: "Unknown",
        className: "bg-skin-proposal-muted",
      };
  }
};

export const getStaticProps = async (): Promise<
  GetStaticPropsResult<NounsProposalsPageProps>
> => {
  try {
    const proposals = await getNounsDaoProposals();

    return {
      props: {
        proposals: proposals.map(({ description, ...proposal }) => proposal),
        latestBlock: 0,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.warn("Unable to load Nouns DAO proposals", error);

    return {
      props: {
        proposals: [],
        latestBlock: 0,
      },
      revalidate: 60,
    };
  }
};

export default function NounsProposalsPage({
  proposals,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>Nouns DAO Proposals | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 pb-12">
        <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <div className="flex w-full flex-col items-center gap-3 lg:w-auto lg:flex-row lg:items-center lg:gap-5">
            <h1 className="text-[36px] leading-none md:text-[44px]">
              Proposals
            </h1>
            <div className="flex w-full max-w-[248px] gap-1 rounded-xl border border-[#b6b6b6] bg-[#f1f1f1] p-1 shadow-[0px_3px_0px_0px_#b6b6b6] lg:w-fit lg:max-w-none lg:gap-1.5 lg:shadow-[0px_4px_0px_0px_#b6b6b6]">
              <Link
                href="/proposals"
                className="flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2 text-center font-heading text-sm leading-tight text-secondary transition hover:bg-[#fff7bf] hover:text-skin-base lg:flex-none lg:px-5 lg:py-3 lg:text-base"
              >
                Yellow Collective
              </Link>
              <Link
                href="/proposals/nouns"
                className="flex min-h-11 flex-1 translate-y-[-1px] items-center justify-center rounded-lg bg-accent px-3 py-2 text-center font-heading text-sm leading-tight text-skin-base shadow-[0px_2px_0px_0px_#b89400] transition lg:flex-none lg:px-5 lg:py-3 lg:text-base lg:shadow-[0px_3px_0px_0px_#b89400]"
              >
                Nouns DAO
              </Link>
            </div>
          </div>

          <p className="max-w-[520px] text-base leading-snug text-secondary">
            Nouns DAO proposals for Yellow Collective meta-governance.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {proposals.length > 0 ? (
            proposals.map((proposal) => (
              <ProposalRow key={proposal.proposalId} proposal={proposal} />
            ))
          ) : (
            <div className="rounded-2xl border border-skin-stroke bg-skin-muted p-8 text-base text-secondary md:text-lg">
              No Nouns DAO proposals found.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const ProposalRow = ({
  proposal,
}: {
  proposal: Omit<NounsDaoProposal, "description">;
}) => {
  const status = getStatus(proposal.state);

  return (
    <Link
      href={`/proposals/nouns/${proposal.proposalNumber}`}
      className="grid min-h-[96px] grid-cols-[44px_1fr] items-center gap-4 rounded-2xl border border-skin-stroke bg-skin-muted p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-md md:grid-cols-[64px_1fr_auto]"
    >
      <div className="font-heading text-2xl text-skin-base">
        {proposal.proposalNumber}
      </div>

      <div className="min-w-0">
        <h2 className="font-heading text-xl leading-tight text-skin-base md:text-2xl">
          {proposal.title}
        </h2>
        <div className="mt-3 flex items-center justify-between gap-3 text-base text-secondary md:block md:text-lg">
          <span>{formatDate(proposal.timeCreated)}</span>
          <div
            className={`${status.className} w-auto shrink-0 rounded-md px-2 py-1 text-center text-xs ${status.className.includes("text-") ? "" : "text-white"} md:hidden`}
          >
            {status.label}
          </div>
        </div>
      </div>

      <div className="hidden items-center justify-start gap-5 md:col-span-1 md:flex md:justify-end">
        <div className="hidden text-base text-secondary sm:block md:text-lg">
          {getDaysFromTimestamp(proposal.timeCreated)}
        </div>
        <div
          className={`${status.className} w-24 rounded-md p-1 px-2 text-center ${status.className.includes("text-") ? "" : "text-white"}`}
        >
          {status.label}
        </div>
      </div>
    </Link>
  );
};
