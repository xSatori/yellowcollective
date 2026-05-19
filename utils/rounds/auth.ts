export type RoundAction = "request" | "submit" | "submit-trait" | "vote";

export const getRoundSignedRequestAction = (action: RoundAction) =>
  `round:${action}`;
