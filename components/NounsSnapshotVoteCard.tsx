import ModalWrapper from "@/components/ModalWrapper";
import { submitSnapshotVote } from "@/utils/snapshot-vote";
import { SNAPSHOT_SPACE_ID, SNAPSHOT_SPACE_URL } from "constants/metagov";
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import useSWR from "swr";
import { useAccount, useSigner } from "wagmi";

type SnapshotProposalState = "pending" | "active" | "closed" | "cancelled";

type SnapshotProposal = {
  id: string;
  title: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: string;
  state: SnapshotProposalState;
  scores: number[];
  scoresTotal: number;
  link: string;
};

type SnapshotVote = {
  id: string;
  voter: string;
  choice: number;
  reason: string;
  vp: number;
  created: number;
};

type SnapshotStatusResponse = {
  space: string;
  spaceUrl: string;
  safeAddress: string;
  proposal: SnapshotProposal | null;
  userVote: SnapshotVote | null;
};

type VoteChoice = {
  snapshotChoice: 1 | 2 | 3;
  label: "For" | "Against" | "Abstain";
  description: string;
  buttonClassName: string;
  shadowColor: string;
};

export default function NounsSnapshotVoteCard({
  proposalNumber,
}: {
  proposalNumber: number;
}) {
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const [modalOpen, setModalOpen] = useState(false);
  const [choice, setChoice] = useState<VoteChoice | null>(null);
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    data,
    error,
    mutate: refreshSnapshot,
  } = useSWR<SnapshotStatusResponse>(
    `/api/metagov/snapshot/nouns/${proposalNumber}${
      address ? `?voter=${address}` : ""
    }`
  );
  const proposal = data?.proposal;
  const isActive = proposal?.state === "active";
  const alreadyVoted = Boolean(data?.userVote);
  const selectedChoice = voteChoices.find(
    (option) => option.snapshotChoice === data?.userVote?.choice
  );
  const scoreTotal = proposal?.scoresTotal || 0;

  const statusLabel = useMemo(() => {
    if (!proposal) return "Not created";
    if (proposal.state === "active") return "Active";
    if (proposal.state === "closed") return "Closed";
    if (proposal.state === "cancelled") return "Cancelled";
    return "Pending";
  }, [proposal]);

  const submitVote = async () => {
    if (!proposal || !choice || !signer || !address) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await submitSnapshotVote({
        signer: signer as ethers.providers.JsonRpcSigner,
        address,
        space: data?.space || SNAPSHOT_SPACE_ID,
        proposal: proposal.id,
        nounsProposalNumber: proposalNumber,
        choice: choice.snapshotChoice,
        reason,
      });
      setModalOpen(false);
      setReason("");
      setChoice(null);
      await refreshSnapshot();
    } catch (error) {
      console.error("Snapshot vote failed", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit Snapshot vote."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-2 rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-2xl font-heading text-skin-base font-bold">
            Yellow Collective Snapshot Vote
          </div>
          <div className="mt-2 text-base text-secondary md:text-lg">
            Community voting for Yellow Collective metagovernance on this Nouns
            proposal.
          </div>
        </div>
        <div className="w-fit rounded-md bg-skin-proposal-highlighted px-3 py-1 text-center font-heading text-sm text-white">
          {statusLabel}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-skin-proposal-danger bg-white p-4 text-skin-proposal-danger">
          Unable to load Snapshot vote status.
        </div>
      ) : !data ? (
        <div className="mt-5 flex items-center gap-3 text-secondary">
          <Image src="/spinner.svg" alt="spinner" width={20} height={20} />
          Loading Snapshot vote...
        </div>
      ) : !proposal ? (
        <div className="mt-5 rounded-xl border border-skin-stroke bg-skin-muted p-4">
          <div className="font-heading text-lg text-skin-base">
            Snapshot proposal not found.
          </div>
          <div className="mt-2 text-base text-secondary">
            Create or publish a Snapshot proposal in {data.space} with a title
            like "{proposalNumber}: Proposal title" before users can vote here.
          </div>
          <Link
            href={data.spaceUrl || SNAPSHOT_SPACE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-[18px] bg-skin-button-accent px-4 py-3 font-heading text-base text-skin-inverted shadow-[0px_4.02px_0px_0px_#3f3f3f] transition hover:-translate-y-0.5 hover:bg-skin-button-accent-hover hover:shadow-[0px_6px_0px_0px_#3f3f3f] active:translate-y-1 active:shadow-none"
          >
            Open Snapshot space
          </Link>
        </div>
      ) : (
        <Fragment>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {voteChoices.map((option, index) => {
              const score = proposal.scores[index] || 0;
              const percentage = scoreTotal
                ? Math.round((score / scoreTotal) * 100)
                : 0;

              return (
                <div
                  key={option.snapshotChoice}
                  className="rounded-xl border border-skin-stroke bg-skin-muted p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-heading text-xl text-skin-base">
                      {option.label}
                    </div>
                    <div className="font-heading text-base text-secondary">
                      {percentage}%
                    </div>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className={option.buttonClassName}
                      style={{ width: `${percentage}%`, height: "100%" }}
                    />
                  </div>
                  <div className="mt-2 text-base text-secondary">
                    {score.toLocaleString()} votes
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-base text-secondary">
              {alreadyVoted && selectedChoice
                ? `You voted ${selectedChoice.label}.`
                : isActive
                  ? "Vote by signing a gasless Snapshot message."
                  : "Voting is not active for this Snapshot proposal."}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={proposal.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-skin-stroke bg-white px-4 font-heading text-base font-bold text-skin-base transition hover:bg-[#fff7bf]"
              >
                View on Snapshot
              </Link>
              <button
                type="button"
                disabled={!isConnected || !isActive || alreadyVoted}
                onClick={() => setModalOpen(true)}
                className={`h-12 rounded-[18px] px-4 font-heading text-base font-bold shadow-[0px_4.02px_0px_0px_#3f3f3f] transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0px_6px_0px_0px_#3f3f3f] enabled:active:translate-y-1 enabled:active:shadow-none disabled:shadow-none ${
                  isConnected && isActive && !alreadyVoted
                    ? "bg-skin-button-accent text-skin-inverted hover:bg-skin-button-accent-hover"
                    : "bg-skin-button-muted text-skin-inverted"
                }`}
              >
                {!isConnected
                  ? "Connect wallet to vote"
                  : alreadyVoted
                    ? "Vote submitted"
                    : "Vote with Yellow Collective on Snapshot"}
              </button>
            </div>
          </div>

          <ModalWrapper
            className="w-full max-w-lg border border-skin-stroke bg-skin-backdrop"
            open={modalOpen}
            setOpen={setModalOpen}
          >
            <div className="rounded-2xl bg-skin-backdrop p-1 text-skin-base">
              <div className="font-heading text-2xl font-bold leading-none">
                Snapshot vote
              </div>
              <div className="mt-2 font-heading text-sm font-bold text-secondary">
                Nouns Proposal {proposalNumber}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {voteChoices.map((option) => (
                  <button
                    key={option.snapshotChoice}
                    type="button"
                    onClick={() => setChoice(option)}
                    className={`rounded-[22px] border-0 px-5 py-5 text-left font-heading font-bold shadow-[0px_6px_0px_0px_var(--vote-shadow)] transition hover:-translate-y-0.5 hover:shadow-[0px_8px_0px_0px_var(--vote-shadow)] active:translate-y-1 active:shadow-[0px_2px_0px_0px_var(--vote-shadow)] ${option.buttonClassName}`}
                    style={
                      {
                        "--vote-shadow": option.shadowColor,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-heading text-2xl font-bold leading-none text-white">
                        {option.label}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white font-heading text-xl leading-none shadow-sm">
                        {choice?.snapshotChoice === option.snapshotChoice
                          ? "+"
                          : ""}
                      </span>
                    </div>
                    <div className="mt-3 font-heading text-base font-bold leading-snug text-white/90">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>

              <label className="mt-5 block font-heading text-sm font-bold text-skin-base">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Optional reason for your vote"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-skin-stroke bg-white px-4 py-3 text-base text-skin-base shadow-sm placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-skin-highlighted"
              />

              {submitError && (
                <div className="mt-4 rounded-xl border border-skin-proposal-danger bg-white p-3 text-sm text-skin-proposal-danger">
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-12 flex-1 rounded-xl border border-skin-stroke bg-white font-heading text-base font-bold text-skin-base transition hover:bg-[#fff7bf]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitVote}
                  disabled={!choice || !signer || submitting}
                  className={`h-12 flex-1 rounded-[18px] px-4 font-heading text-base font-bold shadow-[0px_4.02px_0px_0px_#3f3f3f] transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0px_6px_0px_0px_#3f3f3f] enabled:active:translate-y-1 enabled:active:shadow-none disabled:shadow-none ${
                    choice && signer && !submitting
                      ? "bg-skin-button-accent text-skin-inverted hover:bg-skin-button-accent-hover"
                      : "bg-skin-button-muted text-skin-inverted"
                  }`}
                >
                  {submitting ? (
                    <span className="flex justify-center">
                      <Image
                        src="/spinner.svg"
                        alt="spinner"
                        width={20}
                        height={20}
                      />
                    </span>
                  ) : choice ? (
                    `Submit ${choice.label}`
                  ) : (
                    "Select vote"
                  )}
                </button>
              </div>
            </div>
          </ModalWrapper>
        </Fragment>
      )}
    </section>
  );
}

const voteChoices: VoteChoice[] = [
  {
    snapshotChoice: 1,
    label: "For",
    description: "Support this proposal.",
    buttonClassName: "bg-skin-proposal-success hover:bg-[#13bf62]",
    shadowColor: "#087a3f",
  },
  {
    snapshotChoice: 2,
    label: "Against",
    description: "Vote against this proposal.",
    buttonClassName: "bg-skin-proposal-danger hover:bg-[#f43a35]",
    shadowColor: "#a90f0c",
  },
  {
    snapshotChoice: 3,
    label: "Abstain",
    description: "Participate without voting for or against.",
    buttonClassName: "bg-skin-proposal-muted hover:bg-[#8a8a8a]",
    shadowColor: "#4f4f4f",
  },
];
