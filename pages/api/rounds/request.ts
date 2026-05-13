import type { NextApiRequest, NextApiResponse } from "next";
import { createRoundRequest, type RoundRequestInput } from "data/rounds";

type RequestRoundBody = {
  request?: RoundRequestInput;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = req.body as RequestRoundBody;
    const request = await createRoundRequest(body.request || {});

    return res.status(201).json({ request });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to request round.";
    console.error("Round request failed", error);
    return res.status(400).json({ error: message });
  }
}
