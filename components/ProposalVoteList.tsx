import { shortenAddress } from "@/utils/shortenAddress";
import useEnsName from "@/hooks/fetch/useEnsName";
import { ETHERSCAN_BASEURL } from "constants/urls";
import Link from "next/link";
import { Address, getAddress, isAddress } from "viem";

export type ProposalVote = {
  voter: string;
  support: number;
  weight: string | number;
  reason?: string | null;
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
      {votes.map((vote) => (
        <ProposalVoteRow
          key={`${vote.voter}-${vote.support}-${vote.weight}-${vote.reason}`}
          vote={vote}
        />
      ))}
    </div>
  );
}

const ProposalVoteRow = ({ vote }: { vote: ProposalVote }) => {
  const support = supportLabel(vote.support);
  const normalizedAddress = isAddress(vote.voter)
    ? getAddress(vote.voter)
    : undefined;
  const { data: ensNameResp } = useEnsName(normalizedAddress as Address);
  const voterLabel =
    ensNameResp?.ensName || shortenAddress(normalizedAddress || vote.voter, 4);

  return (
    <div
      className={`rounded-xl border-2 ${support.borderClassName} bg-white p-4`}
    >
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <Link
          href={`${ETHERSCAN_BASEURL}/address/${vote.voter}`}
          rel="noopener noreferrer"
          target="_blank"
          className="font-heading text-base font-bold text-skin-base transition hover:text-skin-highlighted"
        >
          {voterLabel}
        </Link>
        <div className="flex items-center gap-3 text-sm text-skin-base">
          <span className={`font-heading font-bold ${support.textClassName}`}>
            {support.label}
          </span>
          <span className="font-bold text-skin-base">{vote.weight} votes</span>
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
