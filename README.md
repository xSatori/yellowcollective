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
