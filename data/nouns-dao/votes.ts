import {
  getNounsDaoIndexerPool,
  getNounsDaoIndexerSchema,
} from "data/nouns-dao/indexer";

export type NounsDaoProposalVote = {
  voter: string;
  support: number;
  weight: number;
  reason: string;
};

type ColumnRow = {
  table_name: string;
  column_name: string;
};

type VoteTableConfig = {
  tableName: string;
  proposalColumn: string;
  voterColumn: string;
  supportColumn: string;
  weightColumn?: string;
  reasonColumn?: string;
};

const VOTE_TABLE_CANDIDATES = [
  "proposal_votes",
  "proposal_vote",
  "vote_casts",
  "vote_cast",
  "votes",
];

const PROPOSAL_COLUMN_CANDIDATES = [
  "proposal_id",
  "proposalId",
  "proposal_number",
  "proposal",
  "id",
];

const VOTER_COLUMN_CANDIDATES = ["voter", "address", "account", "delegate"];
const SUPPORT_COLUMN_CANDIDATES = ["support", "choice", "vote"];
const WEIGHT_COLUMN_CANDIDATES = ["weight", "votes", "amount"];
const REASON_COLUMN_CANDIDATES = ["reason", "comment", "comments", "message"];

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;

const findColumn = (columns: string[], candidates: string[]) =>
  candidates.find((candidate) => columns.includes(candidate));

const normalizeSupport = (value: unknown) => {
  if (typeof value === "number") return value;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) return numericValue;

  switch (String(value || "").toLowerCase()) {
    case "against":
      return 0;
    case "for":
      return 1;
    case "abstain":
      return 2;
    default:
      return 0;
  }
};

const getVoteTableConfig = async () => {
  const pool = getNounsDaoIndexerPool();
  if (!pool) return undefined;

  const schema = getNounsDaoIndexerSchema();
  const { rows } = await pool.query<ColumnRow>(
    `
      select table_name, column_name
      from information_schema.columns
      where table_schema = $1
        and table_name = any($2)
    `,
    [schema, VOTE_TABLE_CANDIDATES]
  );

  const tableColumns = rows.reduce<Record<string, string[]>>((acc, row) => {
    acc[row.table_name] = acc[row.table_name] || [];
    acc[row.table_name].push(row.column_name);
    return acc;
  }, {});

  for (const tableName of VOTE_TABLE_CANDIDATES) {
    const columns = tableColumns[tableName];
    if (!columns) continue;

    const proposalColumn = findColumn(columns, PROPOSAL_COLUMN_CANDIDATES);
    const voterColumn = findColumn(columns, VOTER_COLUMN_CANDIDATES);
    const supportColumn = findColumn(columns, SUPPORT_COLUMN_CANDIDATES);

    if (!proposalColumn || !voterColumn || !supportColumn) continue;

    return {
      tableName,
      proposalColumn,
      voterColumn,
      supportColumn,
      weightColumn: findColumn(columns, WEIGHT_COLUMN_CANDIDATES),
      reasonColumn: findColumn(columns, REASON_COLUMN_CANDIDATES),
    } satisfies VoteTableConfig;
  }

  return undefined;
};

export const getNounsDaoProposalVotes = async (
  proposalNumber: number
): Promise<NounsDaoProposalVote[]> => {
  const pool = getNounsDaoIndexerPool();
  if (!pool || !Number.isFinite(proposalNumber)) return [];

  const schema = getNounsDaoIndexerSchema();
  const config = await getVoteTableConfig();
  if (!config) return [];

  const table = `${quoteIdent(schema)}.${quoteIdent(config.tableName)}`;
  const proposalColumn = quoteIdent(config.proposalColumn);
  const voterColumn = quoteIdent(config.voterColumn);
  const supportColumn = quoteIdent(config.supportColumn);
  const weightColumn = config.weightColumn
    ? quoteIdent(config.weightColumn)
    : undefined;
  const reasonColumn = config.reasonColumn
    ? quoteIdent(config.reasonColumn)
    : undefined;

  const { rows } = await pool.query<Record<string, unknown>>(
    `
      select
        ${voterColumn} as voter,
        ${supportColumn} as support,
        ${weightColumn ? `${weightColumn} as weight` : "0 as weight"},
        ${reasonColumn ? `${reasonColumn} as reason` : "'' as reason"}
      from ${table}
      where ${proposalColumn}::text = $1
      order by ${weightColumn ? `${weightColumn}::numeric desc nulls last` : voterColumn}
      limit 1000
    `,
    [String(proposalNumber)]
  );

  return rows.map((row) => ({
    voter: String(row.voter || ""),
    support: normalizeSupport(row.support),
    weight: Number(row.weight || 0),
    reason: String(row.reason || ""),
  }));
};
