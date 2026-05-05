import { providers, utils } from "ethers";

export type NounsDaoProposal = {
  proposalId: string;
  proposalNumber: number;
  proposer: string;
  title: string;
  description: string;
  timeCreated: string;
  voteStartBlock: number;
  voteEndBlock: number;
  proposalThreshold: string;
  quorumVotes: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  state: number;
  transactionHash: string;
};

const NOUNS_DAO_PROXY = "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d";
const NOUNS_DAO_START_BLOCK = 12985451;
const CONFIRMATION_BLOCKS = 500;
const BLOCK_RANGE = 50000;
const MAX_PROPOSALS = 60;
const RPC_URLS = [
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
  "https://ethereum.publicnode.com",
  "https://eth.llamarpc.com",
].filter((url, index, urls): url is string =>
  Boolean(url && urls.indexOf(url) === index)
);

const nounsDaoInterface = new utils.Interface([
  "event ProposalCreated(uint256 id,address proposer,address[] targets,uint256[] values,string[] signatures,bytes[] calldatas,uint256 startBlock,uint256 endBlock,string description)",
  "event ProposalCreatedWithRequirements(uint256 id,address proposer,address[] targets,uint256[] values,string[] signatures,bytes[] calldatas,uint256 startBlock,uint256 endBlock,uint256 proposalThreshold,uint256 quorumVotes,string description,uint8 clientId)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposals(uint256 proposalId) view returns (uint256 id,address proposer,uint256 proposalThreshold,uint256 quorumVotes,uint256 eta,uint256 startBlock,uint256 endBlock,uint256 forVotes,uint256 againstVotes,uint256 abstainVotes,bool canceled,bool vetoed,bool executed)",
]);

const stripMarkdownTitle = (value: string) =>
  value
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^title:\s*/i, "")
    .trim();

const getProposalTitle = (description: string, id: string) => {
  const firstLine = description
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? stripMarkdownTitle(firstLine) : `Nouns Proposal ${id}`;
};

export const getNounsDaoProposals = async () => {
  let lastError: unknown;

  for (const rpcUrl of RPC_URLS) {
    try {
      return await getNounsDaoProposalsFromProvider(
        new providers.JsonRpcProvider(rpcUrl)
      );
    } catch (error) {
      lastError = error;
      console.warn(`Unable to load Nouns DAO proposals from ${rpcUrl}`, error);
    }
  }

  throw lastError;
};

const getNounsDaoProposalsFromProvider = async (
  provider: providers.JsonRpcProvider
) => {
  const latestBlock = Math.max(
    NOUNS_DAO_START_BLOCK,
    (await provider.getBlockNumber()) - CONFIRMATION_BLOCKS
  );
  const proposalTopics = [
    nounsDaoInterface.getEventTopic("ProposalCreated"),
    nounsDaoInterface.getEventTopic("ProposalCreatedWithRequirements"),
  ];
  let toBlock = latestBlock;
  let logs: providers.Log[] = [];

  while (logs.length < MAX_PROPOSALS && toBlock > NOUNS_DAO_START_BLOCK) {
    const fromBlock = Math.max(NOUNS_DAO_START_BLOCK, toBlock - BLOCK_RANGE);
    const rangeLogs = await provider.getLogs({
      address: NOUNS_DAO_PROXY,
      fromBlock,
      toBlock,
      topics: [proposalTopics],
    });

    logs = [...rangeLogs, ...logs];
    toBlock = fromBlock - 1;
  }

  const recentLogs = logs.slice(-MAX_PROPOSALS).reverse();

  return Promise.all(
    recentLogs.map(async (log) => {
      const parsed = nounsDaoInterface.parseLog(log);
      const proposalId = parsed.args.id.toString();
      const [block, state, details] = await Promise.all([
        provider.getBlock(log.blockNumber),
        provider
          .call({
            to: NOUNS_DAO_PROXY,
            data: nounsDaoInterface.encodeFunctionData("state", [proposalId]),
          })
          .then((result) =>
            Number(nounsDaoInterface.decodeFunctionResult("state", result)[0])
          )
          .catch(() => 0),
        provider
          .call({
            to: NOUNS_DAO_PROXY,
            data: nounsDaoInterface.encodeFunctionData("proposals", [
              proposalId,
            ]),
          })
          .then((result) =>
            nounsDaoInterface.decodeFunctionResult("proposals", result)
          ),
      ]);
      const description = parsed.args.description as string;

      return {
        proposalId,
        proposalNumber: Number(proposalId),
        proposer: details.proposer,
        title: getProposalTitle(description, proposalId),
        description,
        timeCreated: String(block.timestamp),
        voteStartBlock: Number(details.startBlock.toString()),
        voteEndBlock: Number(parsed.args.endBlock.toString()),
        proposalThreshold: details.proposalThreshold.toString(),
        quorumVotes: details.quorumVotes.toString(),
        forVotes: details.forVotes.toString(),
        againstVotes: details.againstVotes.toString(),
        abstainVotes: details.abstainVotes.toString(),
        targets: parsed.args.targets,
        values: (parsed.args[3] as unknown[]).map((value: unknown) =>
          String(value)
        ),
        signatures: parsed.args.signatures,
        calldatas: parsed.args.calldatas,
        state,
        transactionHash: log.transactionHash,
      } satisfies NounsDaoProposal;
    })
  );
};
