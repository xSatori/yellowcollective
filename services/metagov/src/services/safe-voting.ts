import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import { ethers } from "ethers";
import { config } from "../config";
import { fetchProposalById } from "../listeners/nouns-proposals";
import { SnapshotChoice } from "../types";
import { getProvider } from "../utils/wallet";

const NOUNS_DAO_ABI = [
  "function castRefundableVoteWithReason(uint256 proposalId, uint8 support, string reason, uint32 clientId) returns (uint256)",
  "function getReceipt(uint256 proposalId, address voter) view returns (bool hasVoted, uint8 support, uint96 votes)",
];

const SUPPORT_VALUES: Record<SnapshotChoice, 0 | 1 | 2> = {
  FOR: 1,
  AGAINST: 0,
  ABSTAIN: 2,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ExecutionResult = {
  safeTxHash: string;
  executionTxHash: string;
  blockNumber: number;
  gasUsed: string;
};

const isProposalVoteable = async (proposalId: string) => {
  const proposal = await fetchProposalById(proposalId);
  if (!proposal) return { voteable: false, status: "NOT_FOUND" };

  if (["CANCELLED", "EXECUTED", "VETOED"].includes(proposal.status)) {
    return { voteable: false, status: proposal.status };
  }

  const provider = getProvider();
  const currentBlock = await provider.getBlockNumber();
  const startBlock = Number(proposal.startBlock);
  const endBlock = Number(proposal.endBlock);

  return {
    voteable: currentBlock >= startBlock && currentBlock <= endBlock,
    status:
      currentBlock < startBlock
        ? "PENDING"
        : currentBlock > endBlock
          ? "ENDED"
          : "ACTIVE",
  };
};

export const hasAlreadyVoted = async (proposalId: string) => {
  try {
    const provider = getProvider();
    const nounsDao = new ethers.Contract(
      config.nounsDaoAddress,
      NOUNS_DAO_ABI,
      provider
    );
    const receipt = await nounsDao.getReceipt(proposalId, config.safeAddress);
    return Boolean(receipt.hasVoted || receipt[0]);
  } catch {
    return false;
  }
};

export const executeVoteThroughSafe = async (
  proposalId: string,
  voteChoice: SnapshotChoice,
  reason: string
): Promise<ExecutionResult | null> => {
  const { voteable, status } = await isProposalVoteable(proposalId);
  if (!voteable) {
    console.log(`Cannot vote on Nouns #${proposalId}; status is ${status}`);
    return null;
  }

  if (await hasAlreadyVoted(proposalId)) {
    console.log(`Safe already voted on Nouns #${proposalId}`);
    return null;
  }

  if (config.dryRun) {
    console.log(
      `[DRY RUN] Would vote ${voteChoice} on Nouns #${proposalId} through Safe`
    );
    return {
      safeTxHash: `dry-run-safe-${proposalId}`,
      executionTxHash: `dry-run-execution-${proposalId}`,
      blockNumber: 0,
      gasUsed: "0",
    };
  }

  const provider = getProvider();
  const feeData = await provider.getFeeData();
  const maxAllowed = BigInt(config.maxGasPriceGwei) * 10n ** 9n;
  if (feeData.maxFeePerGas && feeData.maxFeePerGas > maxAllowed) {
    console.warn("Gas is above MAX_GAS_PRICE_GWEI; deferring vote.");
    return null;
  }

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    if (attempt > 0) await sleep(attempt === 1 ? 30_000 : 120_000);
    const result = await attemptExecution(
      proposalId,
      voteChoice,
      reason,
      attempt === config.maxRetries - 1
        ? Math.max(config.gasBufferPercent, 50)
        : config.gasBufferPercent
    );
    if (result) return result;
  }

  return null;
};

const attemptExecution = async (
  proposalId: string,
  voteChoice: SnapshotChoice,
  reason: string,
  gasBufferPercent: number
): Promise<ExecutionResult | null> => {
  try {
    const protocolKit = await Safe.init({
      provider: config.ethereumRpcUrl,
      signer: config.botPrivateKey,
      safeAddress: config.safeAddress,
    });
    const nounsDao = new ethers.Interface(NOUNS_DAO_ABI);
    const data = nounsDao.encodeFunctionData("castRefundableVoteWithReason", [
      proposalId,
      SUPPORT_VALUES[voteChoice],
      reason,
      config.clientId,
    ]);
    const safeTxData: MetaTransactionData = {
      to: config.nounsDaoAddress,
      value: "0",
      data,
    };
    const safeTx = await protocolKit.createTransaction({
      transactions: [safeTxData],
    });
    const signedTx = await protocolKit.signTransaction(safeTx);
    const safeTxHash = await protocolKit.getTransactionHash(signedTx);

    if (config.safeApiKey) {
      try {
        const apiKit = new SafeApiKit({
          chainId: BigInt(config.chainId),
          apiKey: config.safeApiKey,
        });
        const senderAddress = await protocolKit
          .getSafeProvider()
          .getSignerAddress();
        const senderSignature = Array.from(signedTx.signatures.values())[0]
          ?.data;
        if (senderAddress && senderSignature) {
          await apiKit.proposeTransaction({
            safeAddress: config.safeAddress,
            safeTransactionData: signedTx.data,
            safeTxHash,
            senderAddress,
            senderSignature,
          });
        }
      } catch (error) {
        console.warn("Could not record tx in Safe Transaction Service", error);
      }
    }

    console.log(
      `Executing Safe transaction with ${gasBufferPercent}% configured gas buffer.`
    );
    const executionResult = await protocolKit.executeTransaction(signedTx);
    const receipt = await (
      executionResult.transactionResponse as {
        wait: (confirms: number) => Promise<ethers.TransactionReceipt>;
      }
    )?.wait(1);
    const executionTxHash = executionResult.hash || receipt?.hash;

    if (!receipt || receipt.status === 0) {
      console.error(`Safe execution reverted: ${executionTxHash}`);
      return null;
    }

    return {
      safeTxHash,
      executionTxHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error("Safe execution attempt failed", error);
    return null;
  }
};
