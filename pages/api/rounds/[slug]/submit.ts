import type { NextApiRequest, NextApiResponse } from "next";
import { createRoundSubmission, getRoundBySlug } from "data/rounds";
import { verifyRoundWalletAuth } from "@/utils/rounds/auth";

type SubmitRoundBody = {
  walletAddress?: string;
  walletMessage?: string;
  walletSignature?: string;
  submission?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  };
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

const getSlug = (req: NextApiRequest) => {
  const slug = req.query.slug;
  return typeof slug === "string" ? slug : slug?.[0];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const slug = getSlug(req);
  if (!slug) return res.status(400).json({ error: "Round slug is required." });

  try {
    const body = req.body as SubmitRoundBody;
    const walletAddress = await verifyRoundWalletAuth({
      payload: body,
      action: "submit",
      roundSlug: slug,
    });
    const round = await getRoundBySlug(slug);

    if (!round) return res.status(404).json({ error: "Round not found." });

    const submission = await createRoundSubmission(round, {
      ...body.submission,
      walletAddress,
    });

    return res.status(201).json({ submission });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit to round.";
    console.error("Round submission failed", error);
    return res.status(400).json({ error: message });
  }
}
