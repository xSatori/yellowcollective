import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminAddress } from "@/utils/admin";
import { getAdminSessionSignedRequestAction } from "@/utils/admin-auth";
import {
  clearAdminSessionCookie,
  getAdminSessionAddress,
  setAdminSessionCookie,
} from "@/utils/admin-session";
import {
  setNoStoreHeaders,
  verifySignedRequest,
} from "@/utils/signature-auth-server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setNoStoreHeaders(res);

  if (req.method === "GET") {
    const adminAddress = getAdminSessionAddress(req);

    if (!adminAddress || !isAdminAddress(adminAddress)) {
      return res.status(401).json({ error: "Admin session required." });
    }

    return res.status(200).json({ adminAddress });
  }

  if (req.method === "DELETE") {
    clearAdminSessionCookie(res);
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const adminAddress = await verifySignedRequest(req, res, {
    action: getAdminSessionSignedRequestAction(),
    payload: {},
  });

  if (!adminAddress) return;

  if (!isAdminAddress(adminAddress)) {
    return res.status(403).json({ error: "Admin wallet required." });
  }

  setAdminSessionCookie(res, adminAddress);
  return res.status(200).json({ adminAddress });
}
