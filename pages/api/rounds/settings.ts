import type { NextApiRequest, NextApiResponse } from "next";
import { getRoundsPublicEnabled } from "data/rounds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    return res.status(200).json({
      roundsPublicEnabled: await getRoundsPublicEnabled(),
    });
  } catch (error) {
    console.error("Rounds settings load failed", error);
    return res.status(500).json({ error: "Unable to load rounds settings." });
  }
}
