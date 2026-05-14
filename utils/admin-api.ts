import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminAddress } from "./admin";
import { getAdminSignedRequestAction } from "./admin-auth";
import { verifySignedRequest } from "./signature-auth-server";

const ADMIN_QUERY_AUTH_KEYS = new Set([
  "adminAddress",
  "adminMessage",
  "adminSignature",
]);

const hasAdminAuthInQuery = (req: NextApiRequest) =>
  Object.keys(req.query).some((key) => ADMIN_QUERY_AUTH_KEYS.has(key));

export const requireAdminRequest = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (hasAdminAuthInQuery(req)) {
    res
      .status(400)
      .json({ error: "Admin signed authorization is not accepted in URLs." });
    return undefined;
  }

  const adminAddress = await verifySignedRequest(req, res, {
    action: getAdminSignedRequestAction(req.method || ""),
  });

  if (!adminAddress) return undefined;

  if (!isAdminAddress(adminAddress)) {
    res.status(403).json({ error: "Admin wallet required." });
    return undefined;
  }

  return adminAddress;
};
