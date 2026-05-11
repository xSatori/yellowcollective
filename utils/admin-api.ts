import type { NextApiRequest, NextApiResponse } from "next";
import { verifyMessage } from "viem";
import { isAdminAddress } from "./admin";
import {
  isAdminAuthMessageForAddress,
  type AdminAuthPayload,
} from "./admin-auth";

const getQueryValue = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : value?.[0];

export const getAdminAuthFromRequest = (
  req: NextApiRequest
): AdminAuthPayload => {
  const body = req.body as AdminAuthPayload | undefined;

  return {
    adminAddress: getQueryValue(req.query.adminAddress) ?? body?.adminAddress,
    adminMessage: getQueryValue(req.query.adminMessage) ?? body?.adminMessage,
    adminSignature:
      getQueryValue(req.query.adminSignature) ?? body?.adminSignature,
  };
};

export const requireAdminRequest = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { adminAddress, adminMessage, adminSignature } =
    getAdminAuthFromRequest(req);

  if (
    typeof adminAddress !== "string" ||
    typeof adminMessage !== "string" ||
    typeof adminSignature !== "string"
  ) {
    res.status(401).json({ error: "Admin signature required." });
    return undefined;
  }

  if (
    !isAdminAddress(adminAddress) ||
    !isAdminAuthMessageForAddress(adminMessage, adminAddress)
  ) {
    res.status(403).json({ error: "Admin wallet required." });
    return undefined;
  }

  try {
    const isValid = await verifyMessage({
      address: adminAddress as `0x${string}`,
      message: adminMessage,
      signature: adminSignature as `0x${string}`,
    });

    if (!isValid) {
      res.status(403).json({ error: "Admin signature invalid." });
      return undefined;
    }

    return adminAddress;
  } catch (error) {
    console.error("Admin signature verification failed", error);
    res.status(403).json({ error: "Admin signature invalid." });
    return undefined;
  }
};
