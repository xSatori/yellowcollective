import type { Round } from "data/rounds";

export type RoundState =
  | "draft"
  | "upcoming"
  | "submissions_open"
  | "voting_open"
  | "ended"
  | "archived";

export const getRoundState = (
  round: Pick<
    Round,
    | "status"
    | "active"
    | "startsAt"
    | "submissionsOpenAt"
    | "votingStartsAt"
    | "votingEndsAt"
  >,
  now = new Date()
): RoundState => {
  if (round.status === "archived") return "archived";
  if (round.status !== "published" || !round.active) return "draft";

  const currentTime = now.getTime();
  const startsAt = new Date(round.startsAt).getTime();
  const submissionsOpenAt = new Date(round.submissionsOpenAt).getTime();
  const votingStartsAt = new Date(round.votingStartsAt).getTime();
  const votingEndsAt = new Date(round.votingEndsAt).getTime();

  if (currentTime < startsAt || currentTime < submissionsOpenAt) {
    return "upcoming";
  }

  if (currentTime >= submissionsOpenAt && currentTime < votingStartsAt) {
    return "submissions_open";
  }

  if (currentTime >= votingStartsAt && currentTime < votingEndsAt) {
    return "voting_open";
  }

  if (currentTime >= votingEndsAt) {
    return "ended";
  }

  return "upcoming";
};

export const getRoundStateLabel = (state: RoundState) =>
  ({
    draft: "Draft",
    upcoming: "Upcoming",
    submissions_open: "Submissions open",
    voting_open: "Voting open",
    ended: "Ended",
    archived: "Archived",
  })[state];

export const canSubmitToRound = (round: Round, now = new Date()) =>
  getRoundState(round, now) === "submissions_open";

export const canVoteInRound = (round: Round, now = new Date()) =>
  getRoundState(round, now) === "voting_open";
