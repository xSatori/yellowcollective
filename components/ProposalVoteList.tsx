import WalletIdentityLink from "@/components/WalletIdentityLink";
import { useMemo } from "react";
import { isAddress } from "viem";

export type ProposalVote = {
  voter: string;
  support: number;
  weight: string | number;
  reason?: string | null;
  timestamp?: string | number | null;
  blockNumber?: string | number | null;
};

const getVoteSortValue = (vote: ProposalVote) => {
  const timestamp = Number(vote.timestamp || 0);
  if (Number.isFinite(timestamp) && timestamp > 0) return timestamp;

  const blockNumber = Number(vote.blockNumber || 0);
  if (Number.isFinite(blockNumber) && blockNumber > 0) return blockNumber;

  return 0;
};

const supportLabel = (support: number) => {
  switch (support) {
    case 0:
      return {
        label: "Against",
        borderClassName: "border-[#ef2b25]",
        textClassName: "text-[#ef2b25]",
      };
    case 1:
      return {
        label: "For",
        borderClassName: "border-[#00a85a]",
        textClassName: "text-[#00a85a]",
      };
    case 2:
      return {
        label: "Abstain",
        borderClassName: "border-[#8a8f98]",
        textClassName: "text-[#8a8f98]",
      };
    default:
      return {
        label: "Abstain",
        borderClassName: "border-[#8a8f98]",
        textClassName: "text-[#8a8f98]",
      };
  }
};

export default function ProposalVoteList({
  votes,
  isLoading = false,
}: {
  votes?: ProposalVote[];
  isLoading?: boolean;
}) {
  const sortedVotes = useMemo(
    () =>
      (votes || [])
        .map((vote, index) => ({ vote, index }))
        .sort((a, b) => {
          const sortDiff = getVoteSortValue(b.vote) - getVoteSortValue(a.vote);
          if (sortDiff) return sortDiff;
          return a.index - b.index;
        })
        .map(({ vote }) => vote),
    [votes]
  );
  if (isLoading) {
    return <p className="text-base text-secondary">Loading votes...</p>;
  }

  if (!votes || votes.length === 0) {
    return (
      <p className="text-base text-secondary">
        No individual votes or comments are available for this proposal.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedVotes.map((vote) => (
        <ProposalVoteRow
          key={`${vote.voter}-${vote.support}-${vote.weight}-${vote.reason}-${vote.timestamp || ""}-${vote.blockNumber || ""}`}
          vote={vote}
        />
      ))}
    </div>
  );
}

const ProposalVoteRow = ({ vote }: { vote: ProposalVote }) => {
  const support = supportLabel(vote.support);
  const isWallet = isAddress(vote.voter);

  return (
    <div
      className={`rounded-xl border-2 ${support.borderClassName} bg-white p-4`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {isWallet ? (
            <WalletIdentityLink
              address={vote.voter}
              className="font-heading text-base font-bold text-skin-base transition hover:text-skin-highlighted"
            />
          ) : (
            <span className="font-heading text-base font-bold text-skin-base">
              {vote.voter}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-right text-sm text-skin-base sm:gap-3">
          <span className="font-bold text-skin-base">{vote.weight} votes</span>
          <span className={`font-heading font-bold ${support.textClassName}`}>
            {support.label}
          </span>
        </div>
      </div>
      {vote.reason && (
        <p className="mt-3 text-base leading-snug text-skin-base">
          {vote.reason}
        </p>
      )}
    </div>
  );
};
