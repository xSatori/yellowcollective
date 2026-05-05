import Layout from "@/components/Layout";
import ProposalStatus from "@/components/ProposalStatus";
import { getProposalName } from "@/utils/getProposalName";
import { Proposal } from "@/services/nouns-builder/governor";
import { TOKEN_CONTRACT } from "constants/addresses";
import Head from "next/head";
import Link from "next/link";
import { useDAOAddresses, useGetAllProposals } from "hooks";

const formatDate = (timestamp: number) => {
  if (!timestamp) return "";

  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getDaysFromNow = (timestamp: number, futurePrefix: string) => {
  if (!timestamp) return "";

  const diff = timestamp * 1000 - Date.now();
  const days = Math.max(1, Math.round(Math.abs(diff) / 86400000));

  if (diff >= 0) {
    return days === 1
      ? `${futurePrefix} in 1 day`
      : `${futurePrefix} in ${days} days`;
  }

  return days === 1 ? "1 day ago" : `${days} days ago`;
};

const getTimingLabel = (proposal: Proposal) => {
  const now = Date.now() / 1000;

  if (now <= proposal.proposal.voteEnd) {
    return getDaysFromNow(proposal.proposal.voteEnd, "Ends");
  }
  if (proposal.state === 5) {
    return getDaysFromNow(proposal.proposal.voteEnd, "Expires");
  }
  if (proposal.state === 7) {
    return getDaysFromNow(proposal.proposal.timeCreated, "Created");
  }
  return "";
};

export default function ProposalsPage() {
  const { data: addresses } = useDAOAddresses({
    tokenContract: TOKEN_CONTRACT,
  });
  const {
    data: proposals,
    error,
    isLoading,
  } = useGetAllProposals({
    governorContract: addresses?.governor,
  });

  return (
    <Layout>
      <Head>
        <title>Proposals | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 pb-12">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <h1 className="text-[36px] leading-none md:text-[44px]">
              Proposals
            </h1>
            <div className="flex rounded-2xl border border-skin-stroke bg-skin-muted p-1 shadow-sm">
              <Link
                href="/proposals"
                className="rounded-xl bg-[#fff7bf] px-4 py-2 font-heading text-base text-skin-base"
              >
                Yellow Collective
              </Link>
              <Link
                href="/proposals/nouns"
                className="rounded-xl px-4 py-2 font-heading text-base text-secondary transition hover:bg-[#fff7bf] hover:text-skin-base"
              >
                Nouns DAO
              </Link>
            </div>
          </div>
          <Link
            href="/create-proposal"
            className="rounded-[18px] bg-skin-base px-6 py-3 font-heading text-lg leading-none text-skin-inverted shadow-[0px_4.02px_0px_0px_#3f3f3f] transition hover:-translate-y-0.5 hover:shadow-[0px_6px_0px_0px_#3f3f3f] active:translate-y-1 active:shadow-none md:text-xl"
          >
            Create proposal
          </Link>
        </div>

        <div className="flex flex-col gap-5">
          {isLoading || (!addresses?.governor && !error) ? (
            <div className="rounded-2xl border border-skin-stroke bg-skin-muted p-8 text-base text-secondary md:text-lg">
              Loading proposals...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-skin-stroke bg-skin-muted p-8 text-base text-secondary md:text-lg">
              Unable to load proposals.
            </div>
          ) : proposals && proposals.length > 0 ? (
            proposals.map((proposal, index) => (
              <ProposalRow
                key={proposal.proposalId}
                proposal={proposal}
                proposalNumber={proposals.length - index}
              />
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

const ProposalRow = ({
  proposal,
  proposalNumber,
}: {
  proposal: Proposal;
  proposalNumber: number;
}) => {
  const timingLabel = getTimingLabel(proposal);

  return (
    <Link
      href={`/proposals/${proposal.proposalId}`}
      className="grid min-h-[96px] grid-cols-[44px_1fr] items-center gap-4 rounded-2xl border border-skin-stroke bg-skin-muted p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-md md:grid-cols-[44px_1fr_auto]"
    >
      <div className="font-heading text-xl text-skin-base">
        {proposalNumber}
      </div>

      <div className="min-w-0">
        <h2 className="truncate font-heading text-xl leading-none text-skin-base md:text-2xl">
          {getProposalName(proposal.description)}
        </h2>
        <div className="mt-3 text-base text-secondary md:text-lg">
          {formatDate(proposal.proposal.timeCreated)}
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-start gap-5 md:col-span-1 md:justify-end">
        {timingLabel && (
          <div className="hidden text-base text-secondary sm:block md:text-lg">
            {timingLabel}
          </div>
        )}
        <ProposalStatus proposal={proposal} />
      </div>
    </Link>
  );
};
