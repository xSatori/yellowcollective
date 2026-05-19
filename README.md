# Nouns Yellow Collective Auction Site

The Yellow Collective is a new onchain club on the BASE Ethereum L2 network, designed to support and empower artists and creatives in the Nouns and Superchain ecosystems.

The DAO was built using [Nouns Builder](https://nouns.build), and this custom auction site was bootstrapped using the template here: [neokry/noun-site](https://github.com/neokry/noun-site)

# Development

Install dependencies

```bash
yarn install
```

Create a `.env` file with from `.env.sample`, and populate the environment variables

```bash
cp .env.sample .env.local
```

Run the development server:

```bash
yarn dev
```

<<<<<<< Updated upstream
## Content Coining

The simplified coining flow lives at `/coins/create` and targets Base mainnet.
It requires one fixed paired Base coin; users can see that coin but cannot
change it in the UI.

```bash
NEXT_PUBLIC_FIXED_BASE_COIN_ADDRESS="0x..."
NEXT_PUBLIC_FIXED_BASE_COIN_LABEL="Yellow paired coin"
NEXT_PUBLIC_FIXED_BASE_COIN_PRICE_USD="0.01"
NEXT_PUBLIC_CONTENT_COIN_TARGET_FDV_USD=""
PINATA_JWT="..."
```

`NEXT_PUBLIC_FIXED_BASE_COIN_PRICE_USD` is required because the Zora content
coin pool config needs a USD price for the fixed pair. Leave
`NEXT_PUBLIC_CONTENT_COIN_TARGET_FDV_USD` blank to use the Builder-derived
target FDV curve. `PINATA_JWT` is required for media uploads; the browser asks
the local API for a short-lived Pinata signed upload URL, then stores the
returned media URI as `ipfs://...`.

### Content Coin Indexer

The Gallery can also index every Zora coin on Base whose pool is paired with
`NEXT_PUBLIC_FIXED_BASE_COIN_ADDRESS`, including coins created outside this
site. The indexer reads `CoinCreatedV4` events from the Zora coin factory,
filters decoded pool keys by the fixed pair address, fetches metadata, and
upserts rows into `content_coin_gallery_records`.

```bash
yarn index:content-coins
```

Required env:

```bash
DATABASE_PUBLIC_URL="postgresql://..."
NEXT_PUBLIC_FIXED_BASE_COIN_ADDRESS="0x..."
BASE_RPC_URL="https://..."
```

Optional env:

```bash
CONTENT_COIN_INDEXER_START_BLOCK="0"
CONTENT_COIN_INDEXER_BLOCK_RANGE="5000"
CONTENT_COIN_INDEXER_MAX_BLOCKS="50000"
CONTENT_COIN_INDEXER_CONFIRMATIONS="15"
```

For the first full backfill, run:

```bash
yarn index:content-coins --all
```

For Railway, create a cron service that uses the same repo and runs
`yarn index:content-coins`. Railway cron services should finish and exit; this
script does that after each scheduled scan. Use a schedule of `*/15 * * * *` or
slower.

# PWA and Farcaster Mini App

The app ships with a web app manifest at `/manifest.webmanifest`, a
conservative production-only service worker at `/sw.js`, and an offline fallback
at `/offline.html`. The service worker avoids API, admin, profile, vote,
submission, wallet, and dynamic data routes so connected-wallet flows do not
serve stale cached responses.

Mini App metadata is published at `/.well-known/farcaster.json`, and global
`fc:miniapp` / backward-compatible `fc:frame` embed tags are rendered from
`NEXT_PUBLIC_SITE_URL`. Set `NEXT_PUBLIC_SITE_URL` to the canonical production
origin, for example:

```bash
NEXT_PUBLIC_SITE_URL="https://yellowcollective.art"
```

For production Farcaster distribution, add a signed `accountAssociation` to
`public/.well-known/farcaster.json` for the exact production domain. Generate it
from the Farcaster Mini App manifest tool, then redeploy and validate with the
Farcaster Mini App preview.
=======
# Nouns DAO Snapshot Metagovernance

The Nouns proposal detail pages include a Yellow Collective Snapshot voting card.
The card looks up matching proposals in the `yellowcollective.eth` Snapshot space
and lets connected wallets submit gasless Snapshot votes.

## Required Snapshot setup

Create a Snapshot proposal for each Nouns proposal before users vote from the
site. The site matches proposals by one of these formats:

```txt
123: Proposal title
Nouns #123: Proposal title
```

The Snapshot proposal must use single-choice voting with these choices in this
order:

```txt
For
Against
Abstain
```

## Environment

```bash
METAGOV_SAFE_ADDRESS="0x00EC9615Ab4f45cBeb66b5FA36bcEd3D79f38Bb3"
NEXT_PUBLIC_SNAPSHOT_SPACE_ID="yellowcollective.eth"
NEXT_PUBLIC_SNAPSHOT_SPACE_URL="https://snapshot.box/#/s:yellowcollective.eth"
SNAPSHOT_GRAPHQL_URL="https://hub.snapshot.org/graphql"
NEXT_PUBLIC_SNAPSHOT_SEQUENCER_URL="https://seq.snapshot.org"
NEXT_PUBLIC_SNAPSHOT_APP_ID="yellowcollective"
```

## Remaining metagov automation

This website records community votes on Snapshot. A separate bot/service is
still needed to mirror new Nouns proposals into Snapshot automatically and to
cast the final winning Snapshot result on-chain through the Yellow Safe.

## Bot deployment

The bot lives in `services/metagov`. It should run as a separate Railway
service with a persistent volume mounted at `DATA_DIR`.

Required Railway variables:

```bash
BOT_PRIVATE_KEY=""
SAFE_ADDRESS="0x00EC9615Ab4f45cBeb66b5FA36bcEd3D79f38Bb3"
SNAPSHOT_SPACE_ID="yellowcollective.eth"
ETHEREUM_RPC_URL=""
DATA_DIR="/data"
DRY_RUN="true"
```

Recommended variables:

```bash
NOUNS_GRAPHQL_ENDPOINT="https://api.goldsky.com/api/public/project_clnbcoajmebxn33wdbt98f439/subgraphs/nouns-mainnet/1.0.0/gn"
NOUNS_DAO_ADDRESS="0x6f3E6272A167e8AcCb32072d08E0957F9c79223d"
SNAPSHOT_GRAPHQL_URL="https://hub.snapshot.org/graphql"
SNAPSHOT_SEQUENCER_URL="https://seq.snapshot.org"
PROPOSAL_LINK_TEMPLATE="https://nouns.wtf/vote/{id}"
SITE_PROPOSAL_LINK_TEMPLATE="https://yellowcollective.art/proposals/nouns/{id}"
VOTING_DURATION_DAYS="5"
NO_VOTES_ACTION="abstain"
MIN_PROPOSAL_ID="0"
LOOKBACK_DAYS="7"
PROPOSAL_POLL_MINUTES="1"
VOTE_POLL_MINUTES="5"
MAX_GAS_PRICE_GWEI="100"
MAX_RETRIES="3"
```

Start with `DRY_RUN=true`. After the bot creates the expected preview state and
the Safe owner/threshold checks pass, switch to `DRY_RUN=false`.
>>>>>>> Stashed changes
