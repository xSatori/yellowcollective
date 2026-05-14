export type RoundAction = "submit" | "submit-trait" | "vote";

export const getRoundSignedRequestAction = (action: RoundAction) =>
  `round:${action}`;
