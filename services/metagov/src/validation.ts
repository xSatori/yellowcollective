import fs from "fs";
import path from "path";
import Safe from "@safe-global/protocol-kit";
import { ethers } from "ethers";
import { config, validateConfig } from "./config";
import { graphqlRequest } from "./utils/http";
import { getBotWallet, getProvider } from "./utils/wallet";

const SPACE_QUERY = `
  query Space($id: String!) {
    space(id: $id) {
      id
      name
    }
  }
`;

const NOUNS_DAO_ABI = [
  "function getCurrentVotes(address account) view returns (uint96)",
];

export const validateRuntime = async () => {
  validateConfig();

  fs.mkdirSync(config.dataDir, { recursive: true });
  const probePath = path.join(config.dataDir, ".write-test");
  fs.writeFileSync(probePath, "ok");
  fs.rmSync(probePath, { force: true });

  const wallet = getBotWallet();
  const provider = getProvider();
  await provider.getBlockNumber();

  const protocolKit = await Safe.init({
    provider: config.ethereumRpcUrl,
    signer: config.botPrivateKey,
    safeAddress: config.safeAddress,
  });
  const owners = await protocolKit.getOwners();
  const threshold = await protocolKit.getThreshold();
  const walletAddress = wallet.address.toLowerCase();

  if (!owners.some((owner) => owner.toLowerCase() === walletAddress)) {
    throw new Error(
      `Bot wallet ${wallet.address} is not an owner of Safe ${config.safeAddress}.`
    );
  }

  if (threshold !== 1) {
    throw new Error(
      `Safe threshold is ${threshold}; unattended execution requires threshold 1.`
    );
  }

  const nounsDao = new ethers.Contract(
    config.nounsDaoAddress,
    NOUNS_DAO_ABI,
    provider
  );
  const votes = await nounsDao.getCurrentVotes(config.safeAddress);
  if (votes === 0n) {
    console.warn(
      "Safe currently has 0 Nouns current votes. Execution may fail unless delegation/voting power is set before vote time."
    );
  }

  await graphqlRequest<{ space?: { id: string } | null }>(
    config.snapshotGraphql,
    SPACE_QUERY,
    { id: config.snapshotSpaceId }
  );
};
