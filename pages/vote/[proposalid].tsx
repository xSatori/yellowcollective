import WalletIdentityLink from "@/components/WalletIdentityLink";
import { useDAOAddresses, useGetAllProposals } from "hooks/fetch";
import { TOKEN_CONTRACT } from "constants/addresses";
import Image from "next/image";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { getProposalName } from "@/utils/getProposalName";
import ProposalStatus from "@/components/ProposalStatus";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { getProposalDescription } from "@/utils/getProposalDescription";
import ModalWrapper from "@/components/ModalWrapper";
import VoteModal from "@/components/VoteModal";
import ProposalTabs from "@/components/ProposalTabs";
import ProposalTransactions from "@/components/ProposalTransactions";
import ProposalPropdates from "@/components/ProposalPropdates";
import ProposalVoteList, { ProposalVote } from "@/components/ProposalVoteList";
import ProposalVoteSummary from "@/components/ProposalVoteSummary";
import { Fragment, useState } from "react";
import {
  PREVIEW_PROPOSAL_ID,
  Proposal,
} from "@/services/nouns-builder/governor";
import useSWR from "swr";
import { useUserVotes } from "@/hooks/fetch/useUserVotes";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export default function ProposalComponent() {
  const { data: addresses } = useDAOAddresses({
    tokenContract: TOKEN_CONTRACT,
  });
  const { data: proposals } = useGetAllProposals({
    governorContract: addresses?.governor,
  });

  const {
    query: { proposalid },
  } = useRouter();

  const proposalNumber = proposals
    ? proposals.length - proposals.findIndex((x) => x.proposalId === proposalid)
    : 0;

  const proposal = proposals?.find((x) => x.proposalId === proposalid);
  const { data: proposalVotes, isLoading: proposalVotesLoading } = useSWR<
    ProposalVote[]
  >(
    addresses?.governor && proposal?.proposalId
      ? `/api/governor/${addresses.governor}/proposals/${proposal.proposalId}/votes`
      : undefined
  );

  if (!proposal)
    return (
      <Layout>
        <div className="flex items-center justify-around mt-8">
          <Image src={"/spinner.svg"} alt="spinner" width={30} height={30} />
        </div>
      </Layout>
    );

  const { forVotes, againstVotes, abstainVotes, voteEnd, voteStart } =
    proposal?.proposal || {};

  const getVotePercentage = (votes: number) => {
    if (!proposal || !votes) return 0;
    const total = forVotes + againstVotes + abstainVotes;

    const value = Math.round((votes / total) * 100);
    if (value > 100) return 100;
    return value;
  };

  const getDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    const month = date.toLocaleString("default", { month: "long" });
    return `${month} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    const hours = date.getHours() % 12;
    const minutes = date.getMinutes();

    return `${hours}:${minutes} ${date.getHours() >= 12 ? "PM" : "AM"}`;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start">
          <Link
            href="/proposals"
            className="yc-force-white mr-3 flex h-11 min-h-[2.75rem] w-11 min-w-[2.75rem] flex-none items-center justify-center rounded-full border border-skin-stroke bg-white shadow-[0px_4.02px_0px_0px_rgb(var(--color-shadow-neutral))] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_rgb(var(--color-shadow-neutral))] active:translate-y-1 active:shadow-none sm:mr-4"
          >
            <ArrowLeftIcon className="h-4 text-skin-base" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="mr-0 font-heading text-lg text-skin-base sm:mr-2 sm:text-2xl">
                Proposal {proposalNumber}
              </div>
              <ProposalStatus
                proposal={proposal}
                className="w-auto shrink-0 px-2 py-1 text-xs sm:w-24 sm:text-base"
              />
            </div>
            <div className="mt-2 break-words font-heading text-[34px] font-semibold leading-[0.95] text-skin-base sm:text-5xl">
              {getProposalName(proposal.description)}
            </div>
            <div className="mt-3 text-lg font-heading text-skin-muted sm:mt-4 sm:text-2xl">
              Proposed by{" "}
              <WalletIdentityLink
                address={proposal.proposal.proposer}
                className="text-skin-highlighted underline"
              />
            </div>
          </div>
        </div>

        <VoteButton
          proposal={proposal}
          proposalNumber={proposalNumber}
          className="hidden sm:block"
        />
      </div>

      <VoteButton
        proposal={proposal}
        proposalNumber={proposalNumber}
        className="mt-5 sm:hidden"
      />

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
            value: `${proposal.proposal.quorumVotes || 1} Quorum`,
          },
          {
            label: "Ends",
            eyebrow: getTime(voteEnd),
            value: getDate(voteEnd),
          },
          {
            label: "Snapshot",
            eyebrow: getTime(voteStart),
            value: getDate(voteStart),
          },
        ]}
      />

      <div>
        <ProposalTabs
          items={[
            {
              id: "description",
              label: "Description",
              content: (
                <>
                  <section className="yc-dark-surface rounded-b-2xl border border-t-0 border-skin-stroke bg-white p-6 shadow-sm sm:rounded-t-2xl md:p-8">
                    <div className="text-2xl font-heading text-skin-base font-bold">
                      Description
                    </div>

                    <ReactMarkdown
                      className="prose prose-skin mt-4 prose-img:w-auto break-words max-w-[90vw] sm:max-w-[1000px]"
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      remarkPlugins={[remarkGfm]}
                    >
                      {getProposalDescription(proposal.description)}
                    </ReactMarkdown>
                  </section>

                  <ProposalTransactions
                    className="mt-6"
                    transactions={proposal.targets.map((target, index) => ({
                      target,
                      value: proposal.values[index],
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
                <section className="yc-dark-surface rounded-b-2xl border border-t-0 border-skin-stroke bg-white p-6 shadow-sm sm:rounded-t-2xl md:p-8">
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
              content: <ProposalPropdates proposalId={proposal.proposalId} />,
            },
          ]}
        />
      </div>
    </Layout>
  );
}

const VoteButton = ({
  proposal,
  proposalNumber,
  className = "",
}: {
  proposal: Proposal;
  proposalNumber: number;
  className?: string;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const isPreviewProposal = proposal.proposalId === PREVIEW_PROPOSAL_ID;
  const { data: userVotes } = useUserVotes({
    timestamp: proposal.proposal.timeCreated,
  });

  if (
    proposal.state !== 1 ||
    (!isPreviewProposal && (!userVotes || userVotes < 1))
  )
    return <Fragment />;

  return (
    <Fragment>
      <ModalWrapper
        className="w-full max-w-lg border border-skin-stroke bg-skin-backdrop"
        open={modalOpen}
        setOpen={setModalOpen}
      >
        <VoteModal
          proposal={proposal}
          proposalNumber={proposalNumber}
          setOpen={setModalOpen}
        />
      </ModalWrapper>
      <button
        className={`w-full rounded-[18px] bg-skin-button-accent px-4 py-3 font-heading text-base text-skin-inverted shadow-[0px_4.02px_0px_0px_#3f3f3f] transition hover:-translate-y-0.5 hover:bg-skin-button-accent-hover hover:shadow-[0px_6px_0px_0px_#3f3f3f] active:translate-y-1 active:shadow-none sm:w-auto ${className}`}
        onClick={() => setModalOpen(true)}
      >
        Submit vote
      </button>
    </Fragment>
  );
};
