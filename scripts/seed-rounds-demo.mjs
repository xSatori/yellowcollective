import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const workspaceRoot = process.cwd();

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(path.join(workspaceRoot, ".env.local"));
loadEnvFile(path.join(workspaceRoot, ".env"));

const connectionString =
  process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required.");
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 10000,
  max: 2,
  ssl: connectionString.includes("railway.internal")
    ? undefined
    : { rejectUnauthorized: false },
});

const dayMs = 24 * 60 * 60 * 1000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * dayMs).toISOString();

const demoWallets = [
  "0xdcf37d8Aa17142f053AAA7dc56025aB00D897a19",
  "0x70abdCd7A5A8Ff9cDef1ccA9eA15a5d315780986",
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444",
];

const image = (text, bg = "ffcc00", color = "111111") =>
  `https://placehold.co/1200x900/${bg}/${color}.png?text=${encodeURIComponent(
    text
  )}`;

const rounds = [
  {
    slug: "demo-yellow-poster-sprint",
    title: "Demo Yellow Poster Sprint",
    description:
      "A live voting demo round with approved poster submissions and 100 test votes per wallet.",
    content:
      "Create a bold Yellow Collective poster. This demo round is seeded for local review and uses fixed test voting power so admins can try allocation across submissions.",
    image: image("Poster Sprint"),
    startsAt: iso(-3),
    submissionsOpenAt: iso(-2),
    votingStartsAt: iso(-1),
    votingEndsAt: iso(6),
    endsAt: iso(6),
    votingStrategy: "fixed_per_wallet",
    votesPerWallet: 100,
    winnerCount: 3,
    maxSubmissionsPerWallet: 3,
    awards: [
      ["First place", "0.5 ETH", "Top ranked poster after voting closes."],
      ["Second place", "0.25 ETH", "Second ranked poster."],
      ["Third place", "0.1 ETH", "Third ranked poster."],
    ],
    submissions: [
      ["Sunrise Builder Poster", "A bright poster built around the Yellow auction energy.", "Sunrise Poster", 18],
      ["Collective Signal", "A dense graphic system for calls to participate.", "Collective Signal", 12],
      ["Yellow Street Print", "A wheatpaste-ready visual for community distribution.", "Street Print", 7],
      ["Base Daydream", "A clean blue and yellow poster for onchain culture.", "Base Daydream", 3],
    ],
  },
  {
    slug: "demo-sticker-pack-open",
    title: "Demo Sticker Pack Round",
    description:
      "An active submissions demo round for reviewing the submit flow before voting starts.",
    content:
      "Submit sticker concepts for Yellow Collective. This round is open for submissions and will move into fixed test voting later.",
    image: image("Sticker Pack", "fff7bf"),
    startsAt: iso(-1),
    submissionsOpenAt: iso(-1),
    votingStartsAt: iso(5),
    votingEndsAt: iso(11),
    endsAt: iso(11),
    votingStrategy: "fixed_per_wallet",
    votesPerWallet: 50,
    winnerCount: 2,
    maxSubmissionsPerWallet: 5,
    awards: [
      ["First place", "0.2 ETH", "Best sticker pack concept."],
      ["Second place", "0.1 ETH", "Runner-up sticker concept."],
    ],
    submissions: [
      ["Yellow Smiley Sheet", "A sticker sheet for Farcaster replies and community memes.", "Smiley Sheet", 0],
      ["Auction Hammer Pack", "Sticker concepts based on the auction and builder motifs.", "Hammer Pack", 0],
    ],
  },
  {
    slug: "demo-one-wallet-meme-round",
    title: "Demo One Wallet Meme Round",
    description:
      "A second live voting demo using the 1 vote per wallet strategy.",
    content:
      "Submit and vote on Yellow Collective memes. This seeded round demonstrates the one-vote-per-wallet mode.",
    image: image("Meme Round", "1d9bf0", "ffffff"),
    startsAt: iso(-4),
    submissionsOpenAt: iso(-4),
    votingStartsAt: iso(-2),
    votingEndsAt: iso(4),
    endsAt: iso(4),
    votingStrategy: "one_per_wallet",
    votesPerWallet: 1,
    winnerCount: 1,
    maxSubmissionsPerWallet: 2,
    awards: [["Winner", "Custom feature", "Winning meme gets featured on the rounds page."]],
    submissions: [
      ["One Noun Energy", "A meme about showing up with one noun and a strong opinion.", "One Noun", 1],
      ["Yellow Scroll", "A meme about reading every proposal before voting.", "Yellow Scroll", 0],
    ],
  },
  {
    slug: "demo-upcoming-animation-round",
    title: "Demo Upcoming Animation Round",
    description:
      "An upcoming round for reviewing the upcoming state and timeline UI.",
    content:
      "Create short animated loops for Yellow Collective. This seeded round has not opened yet.",
    image: image("Animation Round", "202020", "ffcc00"),
    startsAt: iso(4),
    submissionsOpenAt: iso(5),
    votingStartsAt: iso(12),
    votingEndsAt: iso(18),
    endsAt: iso(18),
    votingStrategy: "one_per_nft",
    votesPerWallet: 1,
    winnerCount: 2,
    maxSubmissionsPerWallet: 2,
    awards: [
      ["First place", "0.4 ETH", "Best animation loop."],
      ["Second place", "0.15 ETH", "Runner-up animation loop."],
    ],
    submissions: [],
  },
  {
    slug: "demo-completed-banner-round",
    title: "Demo Completed Banner Round",
    description:
      "A completed round with rankings, winners, votes, and prize display.",
    content:
      "Design a banner for Yellow Collective. This seeded round is complete so the results UI can be reviewed.",
    image: image("Completed Banner", "ffcc00"),
    startsAt: iso(-24),
    submissionsOpenAt: iso(-23),
    votingStartsAt: iso(-14),
    votingEndsAt: iso(-3),
    endsAt: iso(-3),
    votingStrategy: "fixed_per_wallet",
    votesPerWallet: 10,
    winnerCount: 4,
    maxSubmissionsPerWallet: 2,
    awards: [
      ["First place", "0.3 ETH", "Winning banner."],
      ["Second place", "0.15 ETH", "Runner-up banner."],
      ["Third place", "0.05 ETH", "Third place banner."],
      ["Fourth place", "Community feature", "Featured in the next round recap."],
    ],
    submissions: [
      ["Golden Header", "A clean banner with strong Yellow Collective branding.", "Golden Header", 42],
      ["Base Signal Banner", "A blue-and-yellow banner built for Base-native contexts.", "Base Signal", 29],
      ["Auction Crowd", "A banner showing a packed community auction.", "Auction Crowd", 17],
      ["Sunlit Grid", "A modular banner system for round announcements.", "Sunlit Grid", 9],
      ["Builder Ribbon", "A compact banner treatment for announcing builders.", "Builder Ribbon", 6],
      ["Nounish Footer", "A lower-third banner using Yellow Collective motifs.", "Nounish Footer", 4],
      ["Vote Glow", "A glowing banner concept for voting reminders.", "Vote Glow", 2],
    ],
  },
];

const run = async () => {
  const schemaSql = fs.readFileSync(
    path.join(workspaceRoot, "scripts", "rounds-schema.sql"),
    "utf8"
  );

  await pool.query(schemaSql);
  await pool.query(`
    ALTER TABLE rounds
      ADD COLUMN IF NOT EXISTS voting_strategy text NOT NULL DEFAULT 'one_per_nft',
      ADD COLUMN IF NOT EXISTS votes_per_wallet integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS winner_count integer NOT NULL DEFAULT 1
  `);

  for (const round of rounds) {
    await pool.query("BEGIN");

    try {
      const roundResult = await pool.query(
        `
          INSERT INTO rounds (
            id,
            slug,
            title,
            description,
            content,
            image,
            starts_at,
            submissions_open_at,
            voting_starts_at,
            voting_ends_at,
            ends_at,
            active,
            featured,
            status,
            voting_strategy,
            votes_per_wallet,
            winner_count,
            max_submissions_per_wallet,
            min_title_length,
            max_title_length,
            min_description_length,
            max_description_length
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, 'published', $13, $14, $15, $16, 3, 120, 20, 2000)
          ON CONFLICT (slug) DO UPDATE
          SET title = EXCLUDED.title,
            description = EXCLUDED.description,
            content = EXCLUDED.content,
            image = EXCLUDED.image,
            starts_at = EXCLUDED.starts_at,
            submissions_open_at = EXCLUDED.submissions_open_at,
            voting_starts_at = EXCLUDED.voting_starts_at,
            voting_ends_at = EXCLUDED.voting_ends_at,
            ends_at = EXCLUDED.ends_at,
            active = true,
            featured = EXCLUDED.featured,
            status = 'published',
            voting_strategy = EXCLUDED.voting_strategy,
            votes_per_wallet = EXCLUDED.votes_per_wallet,
            winner_count = EXCLUDED.winner_count,
            max_submissions_per_wallet = EXCLUDED.max_submissions_per_wallet,
            deleted_at = NULL,
            updated_at = now()
          RETURNING id
        `,
        [
          randomUUID(),
          round.slug,
          round.title,
          round.description,
          round.content,
          round.image,
          round.startsAt,
          round.submissionsOpenAt,
          round.votingStartsAt,
          round.votingEndsAt,
          round.endsAt,
          round.slug === "demo-yellow-poster-sprint",
          round.votingStrategy,
          round.votesPerWallet,
          round.winnerCount,
          round.maxSubmissionsPerWallet,
        ]
      );
      const roundId = roundResult.rows[0].id;

      await pool.query(`DELETE FROM round_votes WHERE round_id = $1`, [roundId]);
      await pool.query(`DELETE FROM round_submissions WHERE round_id = $1`, [
        roundId,
      ]);
      await pool.query(`DELETE FROM round_awards WHERE round_id = $1`, [
        roundId,
      ]);

      for (const [index, award] of round.awards.entries()) {
        await pool.query(
          `
            INSERT INTO round_awards (
              id,
              round_id,
              award_position,
              title,
              award_value,
              description
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [randomUUID(), roundId, index + 1, award[0], award[1], award[2]]
        );
      }

      for (const [index, submission] of round.submissions.entries()) {
        const submissionId = randomUUID();
        await pool.query(
          `
            INSERT INTO round_submissions (
              id,
              round_id,
              wallet_address,
              title,
              description,
              image,
              url,
              status,
              approved_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', now())
          `,
          [
            submissionId,
            roundId,
            demoWallets[index % demoWallets.length],
            submission[0],
            submission[1],
            image(submission[2], index % 2 === 0 ? "fff7bf" : "ffcc00"),
            `https://yellowcollective.art/rounds/${round.slug}`,
          ]
        );

        const seededVotes = Number(submission[3] || 0);
        if (seededVotes > 0) {
          await pool.query(
            `
              INSERT INTO round_votes (
                id,
                round_id,
                submission_id,
                wallet_address,
                vote_count
              )
              VALUES ($1, $2, $3, $4, $5)
            `,
            [
              randomUUID(),
              roundId,
              submissionId,
              demoWallets[(index + 2) % demoWallets.length],
              seededVotes,
            ]
          );
        }
      }

      await pool.query("COMMIT");
      console.log(`Seeded ${round.slug}`);
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
};

try {
  await run();
  console.log("Demo rounds seeded.");
} finally {
  await pool.end();
}
