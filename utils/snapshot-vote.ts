import { ethers } from "ethers";
import { SNAPSHOT_APP_ID } from "constants/metagov";

type SnapshotVoteChoice = 1 | 2 | 3;

type SnapshotSigner = ethers.Signer & {
  _signTypedData: (
    domain: Record<string, unknown>,
    types: Record<string, Array<{ name: string; type: string }>>,
    value: Record<string, unknown>
  ) => Promise<string>;
};

type SnapshotVoteInput = {
  signer: SnapshotSigner;
  address: string;
  space: string;
  proposal: string;
  nounsProposalNumber: number;
  choice: SnapshotVoteChoice;
  reason?: string;
};

const snapshotVoteTypes = {
  Vote: [
    { name: "from", type: "string" },
    { name: "space", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "proposal", type: "string" },
    { name: "choice", type: "uint32" },
    { name: "reason", type: "string" },
    { name: "app", type: "string" },
    { name: "metadata", type: "string" },
  ],
};

export const submitSnapshotVote = async ({
  signer,
  address,
  space,
  proposal,
  nounsProposalNumber,
  choice,
  reason,
}: SnapshotVoteInput) => {
  const checksumAddress = ethers.utils.getAddress(address);
  const domain = { name: "snapshot", version: "0.1.4" };
  const message = {
    from: checksumAddress,
    space,
    timestamp: Math.floor(Date.now() / 1000),
    proposal,
    choice,
    reason: reason?.trim() || "",
    app: SNAPSHOT_APP_ID,
    metadata: "{}",
  };

  const signature = await signer._signTypedData(
    domain,
    snapshotVoteTypes,
    message
  );

  const response = await fetch(
    `/api/metagov/snapshot/vote?proposalNumber=${nounsProposalNumber}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: checksumAddress,
        sig: signature,
        data: {
          domain,
          types: snapshotVoteTypes,
          message,
        },
      }),
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error_description ||
      payload?.message ||
      "Snapshot rejected the signed vote.";
    throw new Error(message);
  }

  return payload;
};
