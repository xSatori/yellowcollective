import type { NextApiRequest, NextApiResponse } from "next";
import {
  createNoundrySubmission,
  listNoundrySubmissions,
  validateNoundrySubmission,
  type CreateNoundrySubmissionInput,
} from "data/noundry/submissions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const submissions = await listNoundrySubmissions();
      return res.status(200).json({ submissions });
    }

    if (req.method === "POST") {
      const input = req.body as Partial<CreateNoundrySubmissionInput>;
      const validationError = validateNoundrySubmission(input);

      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const submission = await createNoundrySubmission(
        input as CreateNoundrySubmissionInput
      );
      return res.status(201).json({ submission });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Noundry submissions API failed", error);
    return res.status(500).json({ error: "Unable to access Noundry gallery." });
  }
}
