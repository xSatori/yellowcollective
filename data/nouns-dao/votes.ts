import {
  getNounsDaoIndexerPool,
  getNounsDaoIndexerSchema,
} from "data/nouns-dao/indexer";

export type NounsDaoProposalVote = {
  voter: string;
  support: number;
  weight: number;
  reason: string;
  timestamp: number | null;
  blockNumber: number | null;
};

type ColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
};

type VoteColumn = {
  name: string;
  dataType: string;
};

type VoteTableConfig = {
  tableName: string;
  proposalColumn: string;
  voterColumn: string;
  supportColumn: string;
  weightColumn?: string;
  reasonColumn?: string;
  timestampColumn?: VoteColumn;
  blockNumberColumn?: VoteColumn;
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
const TIMESTAMP_COLUMN_CANDIDATES = [
  "timestamp",
  "created_timestamp",
  "block_timestamp",
  "blockTimestamp",
  "createdAt",
  "created_at",
  "timeCreated",
];
const BLOCK_NUMBER_COLUMN_CANDIDATES = [
  "block_number",
  "blockNumber",
  "block",
];

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;

const findColumn = (columns: string[], candidates: string[]) =>
  candidates.find((candidate) => columns.includes(candidate));

const findColumnMetadata = (
  columns: ColumnRow[],
  candidates: string[]
): VoteColumn | undefined => {
  const name = findColumn(
    columns.map((column) => column.column_name),
    candidates
  );
  const column = columns.find((item) => item.column_name === name);
  return column
    ? { name: column.column_name, dataType: column.data_type }
    : undefined;
};

const getNumericColumnExpression = (column?: VoteColumn) => {
  if (!column) return undefined;

  const quotedColumn = quoteIdent(column.name);
  const dataType = column.dataType.toLowerCase();

  if (dataType.includes("timestamp") || dataType.includes("date")) {
    return `extract(epoch from ${quotedColumn})`;
  }

  if (
    dataType.includes("char") ||
    dataType.includes("text") ||
    dataType.includes("json")
  ) {
    return `nullif(regexp_replace(${quotedColumn}::text, '[^0-9]', '', 'g'), '')::numeric`;
  }

  return `${quotedColumn}::numeric`;
};

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
      select table_name, column_name, data_type
      from information_schema.columns
      where table_schema = $1
        and table_name = any($2)
    `,
    [schema, VOTE_TABLE_CANDIDATES]
  );

  const tableColumns = rows.reduce<Record<string, ColumnRow[]>>((acc, row) => {
    acc[row.table_name] = acc[row.table_name] || [];
    acc[row.table_name].push(row);
    return acc;
  }, {});

  for (const tableName of VOTE_TABLE_CANDIDATES) {
    const columns = tableColumns[tableName];
    if (!columns) continue;
    const columnNames = columns.map((column) => column.column_name);

    const proposalColumn = findColumn(columnNames, PROPOSAL_COLUMN_CANDIDATES);
    const voterColumn = findColumn(columnNames, VOTER_COLUMN_CANDIDATES);
    const supportColumn = findColumn(columnNames, SUPPORT_COLUMN_CANDIDATES);

    if (!proposalColumn || !voterColumn || !supportColumn) continue;

    return {
      tableName,
      proposalColumn,
      voterColumn,
      supportColumn,
      weightColumn: findColumn(columnNames, WEIGHT_COLUMN_CANDIDATES),
      reasonColumn: findColumn(columnNames, REASON_COLUMN_CANDIDATES),
      timestampColumn: findColumnMetadata(columns, TIMESTAMP_COLUMN_CANDIDATES),
      blockNumberColumn: findColumnMetadata(
        columns,
        BLOCK_NUMBER_COLUMN_CANDIDATES
      ),
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
  const timestampExpression = getNumericColumnExpression(config.timestampColumn);
  const blockNumberExpression = getNumericColumnExpression(
    config.blockNumberColumn
  );
  const orderColumn = timestampExpression || blockNumberExpression;

  const { rows } = await pool.query<Record<string, unknown>>(
    `
      select
        ${voterColumn} as voter,
        ${supportColumn} as support,
        ${weightColumn ? `${weightColumn} as weight` : "0 as weight"},
        ${reasonColumn ? `${reasonColumn} as reason` : "'' as reason"},
        ${timestampExpression ? `${timestampExpression} as timestamp` : "null as timestamp"},
        ${blockNumberExpression ? `${blockNumberExpression} as "blockNumber"` : "null as \"blockNumber\""}
      from ${table}
      where ${proposalColumn}::text = $1
      order by ${orderColumn ? `${orderColumn} desc nulls last` : weightColumn ? `${weightColumn}::numeric desc nulls last` : voterColumn}
      limit 1000
    `,
    [String(proposalNumber)]
  );

  return rows.map((row) => ({
    voter: String(row.voter || ""),
    support: normalizeSupport(row.support),
    weight: Number(row.weight || 0),
    reason: String(row.reason || ""),
    timestamp:
      row.timestamp === null || row.timestamp === undefined
        ? null
        : Number(row.timestamp),
    blockNumber:
      row.blockNumber === null || row.blockNumber === undefined
        ? null
        : Number(row.blockNumber),
  }));
};
