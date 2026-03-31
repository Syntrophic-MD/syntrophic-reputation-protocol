# ERC-8004 Batch Wallet + Registration Runbook

## Secure file layout
- Secrets env: `.secrets/main.env`
- Generated wallet batches: `.secrets/wallet-batches/<timestamp>/`
- Git ignores:
  - `.secrets/`
  - `.env`

## One command for batch creation
```bash
scripts/erc8004_batch_register.sh --count 5
```

## Recommended mode for metadata URIs
Use `uri-via-set` for maximum compatibility (register first, then set URI):
```bash
scripts/erc8004_batch_register.sh \
  --count 5 \
  --register-mode uri-via-set \
  --uri-file profiles/metadata_uris_223_227.txt \
  --fund-amount 0.00001ether \
  --gas-price-wei 10000000
```

## Optional flags
```bash
# Change top-up amount per wallet
scripts/erc8004_batch_register.sh --count 5 --fund-amount 0.00005ether

# Dry run (no onchain txs, only wallet generation + output files)
scripts/erc8004_batch_register.sh --count 5 --dry-run

# Register using register(string) with URI prefix
scripts/erc8004_batch_register.sh --count 5 --register-mode uri --uri-prefix https://example.com/agents
```

## Outputs per run
- `wallets.json` (sensitive): generated addresses and private keys
- `wallets.env` (sensitive): key/value export of generated addresses and private keys
- `report.json` (sensitive): tx hashes + registration details
- `summary.csv` (safe to share): address + agent ID + tx hashes + verification status

## SRP Batch Bonding
Use this to bond already-registered ERC-8004 agent IDs via Syntrophic Reputation Protocol.

```bash
scripts/sbp_batch_bond.sh \
  --agents-file .secrets/wallet-batches/agents_222_227_wallets.json \
  --ids 32055,36105,36109,36110 \
  --gas-price-wei 6000000
```

### Notes
- The script checks Base chain (`8453`), owner match, current `isBonded`, and only tops up deficits.
- If an agent is already bonded, it skips writes safely.
- Outputs:
  - `.secrets/wallet-batches/sbp_bond_report_<timestamp>.json`
  - `.secrets/wallet-batches/sbp_bond_summary_<timestamp>.csv`
- `isBonded=true` is the canonical bonded source of truth.
- `syntrophic.status` metadata may remain empty (`0x`) unless the registry adapter is authorized for that agent ID.
