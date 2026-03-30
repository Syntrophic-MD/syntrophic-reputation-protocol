# AGENTS.md - Syntrophic Evaluation Guide

This file is for autonomous evaluators and human judges reviewing this repository.

## One-Line Thesis

Syntrophic extends ERC-8004 identity with a bonded trust layer and ROFL-validated attestations so agents can signal credibility from day zero, with portable on-chain metadata any app can verify.

## What Is Implemented (Not Just Proposed)

- Live Base mainnet deployment (V2 — Sprint 0):
  - `ERC8004RegistryAdapter` V2: `0x2ADF396943421a70088d74A8281852344606D668`
  - `SBPVault` V2: `0xFdB160B2B2f2e6189895398563D907fD8239d4e3`
  - `SyntrophicOnboarder`: `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4`
  - Legacy V1 vault (agent #222): `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`
- Working contract stack in `protocol/`:
  - `SBPVault` (bond/bondFor/bondStrict/updateScore/requestUnstake/executeSlash/withdraw)
  - `ERC8004RegistryAdapter` (syncs `syntrophic.*` metadata keys + syncBondMetadata backfill)
  - `SyntrophicOnboarder` (atomic register+bond in one transaction)
- Working frontend in `frontend/`:
  - explorer experience for Syntrophic trust context

## Judge Fast-Path (3-5 Minutes)

1. Read [docs/SBP_Base_Mainnet_Demo_Report.md](docs/SBP_Base_Mainnet_Demo_Report.md) for deployment tx hashes.
2. Confirm metadata on Base:

```bash
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.status" --rpc-url https://mainnet.base.org
cast call 0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248 "isBonded(uint256)(bool)" 32055 --rpc-url https://mainnet.base.org

# Verify V2 vault is live
cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "BOND_AMOUNT()(uint256)" --rpc-url https://mainnet.base.org
```

3. Run protocol tests:

```bash
cd protocol
forge test --offline
```

Expected local result: `32 passed, 0 failed`.

## Architecture Summary

### Trust Primitive
- **Economic stake**: owner of an ERC-8004 `agentId` posts a bond.
- **ROFL validation path**: score/slash state transitions require EIP-712 signatures from configured `roflSigner`.
- **Portable trust state**: adapter writes canonical `syntrophic.*` metadata into ERC-8004.

### Key Contract Parameters (Current)
- `BOND_AMOUNT = 0.00001 ETH`
- `SLASH_THRESHOLD = 51`
- `COOLDOWN_SECONDS = 30 days`
- `STANDARD_WINDOW_BLOCKS = 300`
- `NEW_USER_WINDOW_BLOCKS = 1800`

## Known Limits (Transparent)

- ROFL attestation authority is single-signer in this version.
- Bond size is hackathon-tuned, not production-calibrated.
- Explorer bonded filtering currently depends on available indexer metadata behavior.

## Canonical References

- [README.md](README.md)
- [docs/ERC-Syntrophic-Draft.md](docs/ERC-Syntrophic-Draft.md)
- [docs/SBP_Base_Mainnet_Demo_Report.md](docs/SBP_Base_Mainnet_Demo_Report.md)
- [protocol/README.md](protocol/README.md)
- [frontend/README.md](frontend/README.md)
