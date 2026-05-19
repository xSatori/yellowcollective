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
