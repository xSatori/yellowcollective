import type { NextApiRequest, NextApiResponse } from "next";
import { getYellowCollectiveArtwork } from "data/nouns-builder/artwork";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const artwork = await getYellowCollectiveArtwork();
    return res.status(200).json(artwork);
  } catch (error) {
    console.error("Unable to load Yellow Collective artwork", error);
    return res.status(500).json({
      error: "Unable to load Yellow Collective artwork.",
    });
  }
}
