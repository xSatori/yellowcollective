import type { NextApiRequest, NextApiResponse } from "next";
import type { PlaygroundArtwork } from "data/nouns-builder/artwork";
import fs from "fs/promises";
import path from "path";

const localManifestPath = path.join(
  process.cwd(),
  "public",
  "playground",
  "yellow-collective",
  "manifest.json"
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const manifest = await fs.readFile(localManifestPath, "utf8");
    return res.status(200).json(JSON.parse(manifest) as PlaygroundArtwork);
  } catch (error) {
    console.error("Unable to load Yellow Collective artwork", error);
    return res.status(500).json({
      error: "Unable to load Yellow Collective artwork.",
    });
  }
}
