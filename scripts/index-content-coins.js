const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { Pool } = require("pg");

const BASE_CHAIN_ID = 8453;
const DEFAULT_FACTORY_ADDRESS = "0x777777751622c0d3258f214F9DF38E35BF45baF3";
const DEFAULT_RPC_URL = "https://mainnet.base.org";
const DEFAULT_CONFIRMATIONS = 15;
const DEFAULT_BLOCK_RANGE = 5000;
const DEFAULT_MAX_BLOCKS = 50000;
const DEFAULT_METADATA_TIMEOUT_MS = 10000;

const abi = [
  "event CoinCreatedV4(address indexed caller,address indexed payoutRecipient,address indexed platformReferrer,address currency,string uri,string name,string symbol,address coin,tuple(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bytes32 poolKeyHash,string version)",
];

const iface = new ethers.utils.Interface(abi);
const coinCreatedTopic = iface.getEventTopic("CoinCreatedV4");
const originalEnvKeys = new Set(Object.keys(process.env));

const loadEnvFile = (filename) => {
  const fullPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) return;

  for (const line of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (originalEnvKeys.has(key)) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const getRequiredAddress = (value, label) => {
  if (!value || !ethers.utils.isAddress(value)) {
    throw new Error(`${label} must be a valid address.`);
  }

  return ethers.utils.getAddress(value);
};

const getNumberEnv = (key, fallback) => {
  const value = process.env[key];
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${key} must be a non-negative number.`);
  }

  return parsed;
};

const getDbConnectionString = () =>
  process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

const getRpcUrl = () =>
  process.env.BASE_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  DEFAULT_RPC_URL;

const getIpfsGateway = () => {
  const gateway =
    process.env.IPFS_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
    "https://ipfs.io/ipfs/";

  return gateway.endsWith("/") ? gateway : `${gateway}/`;
};

const normalizeIpfsUrl = (value) => {
  if (!value || !value.startsWith("ipfs://")) return value || "";

  const gateway = getIpfsGateway();
  const pathValue = value.replace(/^ipfs:\/\//, "").replace(/^ipfs\//, "");
  return `${gateway}${pathValue}`;
};

const isUsableUrl = (value) => {
  if (!value) return false;
  if (value.startsWith("ipfs://")) return value.length > "ipfs://".length;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const cleanText = (value, fallback, maxLength) => {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, maxLength);
};

const createSlug = (title, address) => {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "content-coin";

  return `${base}-${address.slice(2, 8).toLowerCase()}`;
};

const parseDataJson = (uri) => {
  const commaIndex = uri.indexOf(",");
  if (commaIndex < 0) return null;

  const mediaType = uri.slice(0, commaIndex).toLowerCase();
  const body = uri.slice(commaIndex + 1);
  const json = mediaType.includes(";base64")
    ? Buffer.from(body, "base64").toString("utf8")
    : decodeURIComponent(body);

  return JSON.parse(json);
};

const fetchMetadata = async (uri) => {
  if (!uri) return null;

  try {
    if (uri.startsWith("data:application/json")) return parseDataJson(uri);

    const url = normalizeIpfsUrl(uri);
    if (!isUsableUrl(url)) return null;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      getNumberEnv("CONTENT_COIN_INDEXER_METADATA_TIMEOUT_MS", DEFAULT_METADATA_TIMEOUT_MS)
    );

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) return null;

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn(`Unable to load coin metadata ${uri}: ${error.message}`);
    return null;
  }
};

const ensureTables = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_coin_gallery_records (
      address text PRIMARY KEY,
      slug text NOT NULL,
      title text NOT NULL,
      coin_name text NOT NULL,
      symbol text NOT NULL,
      description text NOT NULL,
      media_url text NOT NULL,
      image_url text NOT NULL DEFAULT '',
      owner_address text NOT NULL,
      payout_recipient text NOT NULL,
      hidden boolean NOT NULL DEFAULT false,
      transaction_hash text,
      creator_address text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await pool.query(`
    ALTER TABLE content_coin_gallery_records
      ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS content_coin_gallery_records_owner_idx
      ON content_coin_gallery_records (lower(owner_address))
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_coin_indexer_state (
      id text PRIMARY KEY,
      fixed_pair_address text NOT NULL,
      factory_address text NOT NULL,
      last_scanned_block bigint NOT NULL DEFAULT 0,
      indexed_count bigint NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
};

const getState = async (pool, id) => {
  const result = await pool.query(
    `
      SELECT last_scanned_block, indexed_count
      FROM content_coin_indexer_state
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  if (!result.rows[0]) return null;

  return {
    lastScannedBlock: Number(result.rows[0].last_scanned_block),
    indexedCount: Number(result.rows[0].indexed_count),
  };
};

const saveState = async ({
  pool,
  id,
  fixedPairAddress,
  factoryAddress,
  lastScannedBlock,
  indexedCount,
}) => {
  await pool.query(
    `
      INSERT INTO content_coin_indexer_state (
        id,
        fixed_pair_address,
        factory_address,
        last_scanned_block,
        indexed_count,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, now())
      ON CONFLICT (id)
      DO UPDATE SET
        fixed_pair_address = EXCLUDED.fixed_pair_address,
        factory_address = EXCLUDED.factory_address,
        last_scanned_block = EXCLUDED.last_scanned_block,
        indexed_count = content_coin_indexer_state.indexed_count + EXCLUDED.indexed_count,
        updated_at = now()
    `,
    [id, fixedPairAddress, factoryAddress, lastScannedBlock, indexedCount]
  );
};

const upsertCoin = async ({ pool, event, metadata, transactionHash, createdAt }) => {
  const coinAddress = ethers.utils.getAddress(event.coin);
  const caller = ethers.utils.getAddress(event.caller);
  const payoutRecipient = ethers.utils.getAddress(event.payoutRecipient);
  const name = cleanText(metadata?.name, event.name, 100);
  const symbol = cleanText(metadata?.symbol, event.symbol, 10).toUpperCase();
  const title = cleanText(metadata?.content?.title, name, 160);
  const description = cleanText(
    metadata?.description,
    `Content coin paired with the configured Base coin.`,
    1000
  );
  const metadataMediaUrl =
    metadata?.content?.url || metadata?.animation_url || metadata?.image || "";
  const mediaUrl = isUsableUrl(metadataMediaUrl)
    ? metadataMediaUrl.trim()
    : `https://zora.co/coin/base:${coinAddress}`;
  const imageUrl = isUsableUrl(metadata?.image) ? metadata.image.trim() : "";

  await pool.query(
    `
      INSERT INTO content_coin_gallery_records (
        address,
        slug,
        title,
        coin_name,
        symbol,
        description,
        media_url,
        image_url,
        owner_address,
        payout_recipient,
        hidden,
        transaction_hash,
        creator_address,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, $13, now())
      ON CONFLICT (address)
      DO UPDATE SET
        title = EXCLUDED.title,
        coin_name = EXCLUDED.coin_name,
        symbol = EXCLUDED.symbol,
        description = EXCLUDED.description,
        media_url = EXCLUDED.media_url,
        image_url = EXCLUDED.image_url,
        owner_address = EXCLUDED.owner_address,
        payout_recipient = EXCLUDED.payout_recipient,
        transaction_hash = COALESCE(content_coin_gallery_records.transaction_hash, EXCLUDED.transaction_hash),
        creator_address = COALESCE(content_coin_gallery_records.creator_address, EXCLUDED.creator_address),
        hidden = content_coin_gallery_records.hidden,
        updated_at = now()
    `,
    [
      coinAddress,
      createSlug(title, coinAddress),
      title,
      name,
      symbol,
      description,
      mediaUrl,
      imageUrl,
      caller,
      payoutRecipient,
      transactionHash,
      caller,
      createdAt,
    ]
  );
};

const getBlockTimestamp = async (provider, cache, blockNumber) => {
  if (cache.has(blockNumber)) return cache.get(blockNumber);

  const block = await provider.getBlock(blockNumber);
  const timestamp = new Date(block.timestamp * 1000);
  cache.set(blockNumber, timestamp);
  return timestamp;
};

const parseFromBlockArg = () => {
  const arg = process.argv.find((value) => value.startsWith("--from-block="));
  if (!arg) return null;

  const value = Number(arg.split("=")[1]);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("--from-block must be a non-negative integer.");
  }

  return value;
};

const main = async () => {
  const connectionString = getDbConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required.");
  }

  const fixedPairAddress = getRequiredAddress(
    process.env.NEXT_PUBLIC_FIXED_BASE_COIN_ADDRESS,
    "NEXT_PUBLIC_FIXED_BASE_COIN_ADDRESS"
  );
  const factoryAddress = getRequiredAddress(
    process.env.CONTENT_COIN_FACTORY_ADDRESS || DEFAULT_FACTORY_ADDRESS,
    "CONTENT_COIN_FACTORY_ADDRESS"
  );
  const provider = new ethers.providers.JsonRpcProvider(getRpcUrl(), BASE_CHAIN_ID);
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    max: 2,
    ssl: connectionString.includes("railway.internal")
      ? undefined
      : { rejectUnauthorized: false },
  });

  const blockRange = getNumberEnv("CONTENT_COIN_INDEXER_BLOCK_RANGE", DEFAULT_BLOCK_RANGE);
  const confirmations = getNumberEnv(
    "CONTENT_COIN_INDEXER_CONFIRMATIONS",
    DEFAULT_CONFIRMATIONS
  );
  const scanAll = process.argv.includes("--all");
  const maxBlocks = scanAll
    ? 0
    : getNumberEnv("CONTENT_COIN_INDEXER_MAX_BLOCKS", DEFAULT_MAX_BLOCKS);
  const envStartBlock = getNumberEnv("CONTENT_COIN_INDEXER_START_BLOCK", 0);
  const fromBlockArg = parseFromBlockArg();
  const stateId = `zora-base:${factoryAddress.toLowerCase()}:${fixedPairAddress.toLowerCase()}`;
  const blockTimestampCache = new Map();

  try {
    await ensureTables(pool);

    const state = await getState(pool, stateId);
    const latestBlock = Math.max(0, (await provider.getBlockNumber()) - confirmations);
    const startBlock =
      fromBlockArg !== null
        ? fromBlockArg
        : state
          ? state.lastScannedBlock + 1
          : envStartBlock;
    const stopBlock =
      maxBlocks > 0
        ? Math.min(latestBlock, startBlock + maxBlocks - 1)
        : latestBlock;

    if (startBlock > stopBlock) {
      console.log(
        `Content coin indexer is caught up at block ${state?.lastScannedBlock || 0}.`
      );
      return;
    }

    console.log(
      `Indexing Zora coins paired with ${fixedPairAddress} from block ${startBlock} to ${stopBlock}.`
    );

    let indexedCount = 0;
    let scannedTo = startBlock - 1;

    for (let fromBlock = startBlock; fromBlock <= stopBlock; fromBlock += blockRange) {
      const toBlock = Math.min(stopBlock, fromBlock + blockRange - 1);
      const logs = await provider.getLogs({
        address: factoryAddress,
        fromBlock,
        toBlock,
        topics: [coinCreatedTopic],
      });

      let chunkIndexedCount = 0;

      for (const log of logs) {
        const parsed = iface.parseLog(log);
        const poolKey = parsed.args.poolKey;
        const currency0 = ethers.utils.getAddress(poolKey.currency0 || poolKey[0]);
        const currency1 = ethers.utils.getAddress(poolKey.currency1 || poolKey[1]);

        if (
          currency0.toLowerCase() !== fixedPairAddress.toLowerCase() &&
          currency1.toLowerCase() !== fixedPairAddress.toLowerCase()
        ) {
          continue;
        }

        const metadata = await fetchMetadata(parsed.args.uri);
        const createdAt = await getBlockTimestamp(
          provider,
          blockTimestampCache,
          log.blockNumber
        );

        await upsertCoin({
          pool,
          event: parsed.args,
          metadata,
          transactionHash: log.transactionHash,
          createdAt,
        });

        chunkIndexedCount += 1;
      }

      scannedTo = toBlock;
      indexedCount += chunkIndexedCount;
      await saveState({
        pool,
        id: stateId,
        fixedPairAddress,
        factoryAddress,
        lastScannedBlock: scannedTo,
        indexedCount: chunkIndexedCount,
      });

      console.log(
        `Scanned ${fromBlock}-${toBlock}; indexed ${chunkIndexedCount} matching coins.`
      );
    }

    console.log(
      `Content coin indexing complete. Scanned through block ${scannedTo}; indexed ${indexedCount} matching coins.`
    );
  } finally {
    await pool.end();
  }
};

main().catch((error) => {
  console.error("Content coin indexer failed", error);
  process.exit(1);
});
