import type { Round } from "data/rounds";
import { getRoundState, getRoundStateLabel } from "@/utils/rounds/state";
import Link from "next/link";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export const RoundStatusPill = ({ status }: { status: string }) => {
  const color =
    status === "published" ||
    status === "approved" ||
    status === "voting_open" ||
    status === "submissions_open"
      ? "bg-[#e7f7df] text-[#276514]"
      : status === "archived" || status === "rejected" || status === "hidden"
        ? "bg-[#f8d7d7] text-[#8c1d1d]"
        : "bg-[#fff7bf] text-[#6d5600]";

  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};

export const RoundCard = ({ round }: { round: Round }) => {
  const state = getRoundState(round);
  const isOpen = state === "submissions_open";
  const isVoting = state === "voting_open";
  const isUpcoming = state === "upcoming";
  const isCompleted = state === "ended";
  const statusLabel =
    isUpcoming
      ? `Submissions open ${formatDate(round.submissionsOpenAt)}`
      : getRoundStateLabel(state);
  const dateDetail =
    isOpen
      ? {
          label: "Voting starts",
          value: formatDate(round.votingStartsAt),
        }
      : isVoting
        ? {
            label: "Voting ends",
            value: formatDate(round.votingEndsAt),
          }
        : null;
  const showStats = !isUpcoming;
  const showVotes = isVoting || isCompleted;

  return (
    <Link
      href={`/rounds/${round.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-skin-stroke bg-white shadow-[0px_4.02px_0px_0px_rgb(var(--color-shadow-neutral))] transition hover:-translate-y-0.5 hover:shadow-[0px_6px_0px_0px_rgb(var(--color-shadow-neutral))] active:translate-y-1 active:shadow-none"
    >
      <div className="aspect-[4/3] overflow-hidden bg-[#fff7bf]">
        {round.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={round.image}
            alt={round.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center font-heading text-3xl text-skin-base">
            {round.title}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 border-t border-skin-stroke p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-words font-heading text-2xl leading-none text-skin-base">
            {round.title}
          </h2>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <RoundStatusPill status={statusLabel} />
            {dateDetail && (
              <div className="whitespace-nowrap text-xs font-semibold text-secondary">
                {dateDetail.label} {dateDetail.value}
              </div>
            )}
          </div>
        </div>
        <p className="text-base leading-snug text-secondary">
          {round.description || "Round details coming soon."}
        </p>
        {showStats && (
          <div
            className={`mt-auto grid gap-3 text-sm text-secondary ${
              showVotes ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div>
              <div className="font-heading text-base text-skin-base">
                Submissions
              </div>
              {round.approvedSubmissionCount || 0}
            </div>
            {showVotes && (
              <div>
                <div className="font-heading text-base text-skin-base">
                  Votes
                </div>
                {round.totalVotes || 0}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
