import {
  getProfileMetadata,
  saveProfileMetadata,
  verifyProfileUpdate,
} from "data/profile";
import type { NextApiRequest, NextApiResponse } from "next";
import { getAddress, isAddress } from "viem";

type UpdateProfileBody = {
  walletAddress?: string;
  walletMessage?: string;
  walletSignature?: string;
  profile?: {
    username?: string;
    websiteUrl?: string;
    farcaster?: string;
    twitter?: string;
    avatarUrl?: string;
  };
};

const getRequestedAddress = (req: NextApiRequest) => {
  const rawAddress = Array.isArray(req.query.address)
    ? req.query.address[0]
    : req.query.address;

  return rawAddress && isAddress(rawAddress) ? getAddress(rawAddress) : undefined;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const address = getRequestedAddress(req);

  if (!address) {
    return res.status(400).json({ error: "Invalid wallet address." });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json({ profile: await getProfileMetadata(address) });
    }

    if (req.method === "PUT") {
      const body = req.body as UpdateProfileBody;
      const walletAddress = body.walletAddress || "";
      const walletMessage = body.walletMessage || "";
      const walletSignature = body.walletSignature || "";

      if (!isAddress(walletAddress) || getAddress(walletAddress) !== address) {
        return res.status(403).json({ error: "You can only edit your own profile." });
      }

      const verified = verifyProfileUpdate({
        address,
        message: walletMessage,
        signature: walletSignature,
      });

      if (!verified) {
        return res.status(403).json({ error: "Profile update signature is invalid." });
      }

      const profile = await saveProfileMetadata({
        address,
        input: body.profile || {},
      });

      return res.status(200).json({ profile });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Profile API failed", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to update profile.",
    });
  }
}
