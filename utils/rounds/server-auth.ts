import type { NextApiRequest, NextApiResponse } from "next";
import { getRoundSignedRequestAction, type RoundAction } from "./auth";
import { verifySignedRequest } from "../signature-auth-server";

export const verifyRoundWalletSignedRequest = async ({
  req,
  res,
  action,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
  action: RoundAction;
}) =>
  verifySignedRequest(req, res, {
    action: getRoundSignedRequestAction(action),
  });
