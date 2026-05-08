import type { NextApiRequest, NextApiResponse } from "next";
import { getCollectiveNounTokens } from "data/nouns-builder/probe";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const data = await getCollectiveNounTokens();
    res.setHeader(
      "Cache-Control",
      "s-maxage=120, stale-while-revalidate=86400"
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error("Unable to load Probe tokens", error);
    return res.status(500).json({
      error: "Unable to load Collective Nouns.",
    });
  }
}
