# Yellow Metagov Bot

Standalone Railway service that mirrors Nouns DAO proposals into the
`yellowcollective.eth` Snapshot space, watches the Snapshot results, and casts
the final vote through the Yellow Collective Safe.

## Railway setup

Set the Railway service root directory to this folder:

```txt
services/metagov
```

Add a persistent volume and mount it at:

```txt
/data
```

Required variables:

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

## Required Safe setup

- The bot wallet must be an owner of the Safe.
- The Safe threshold must be `1` for unattended execution.
- The Safe must have Nouns voting power or delegation when the bot executes.
- Start with `DRY_RUN=true`; only switch to `false` after the first dry-run
  cycle creates the expected state.

## Endpoints

```txt
GET /health
GET /state
GET /state/:nounsProposalId
```
