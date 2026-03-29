# AGENTS.md - Syntrophic Evaluation Guide

This file is for autonomous evaluators and human judges reviewing this repository.

## One-Line Thesis

Syntrophic extends ERC-8004 identity with a bonded trust layer and ROFL-validated attestations so agents can signal credibility from day zero, with portable on-chain metadata any app can verify.

## What Is Implemented (Not Just Proposed)

- Live Base mainnet deployment:
  - `ERC8004RegistryAdapter`: `0x63DCE10906BB3D3C8280A3fa578594D261C4b804`
  - `SBPVault`: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`
  - Bonded ERC-8004 agent: `32055`
- Working contract stack in `protocol/`:
  - `SBPVault` (bond/updateScore/requestUnstake/executeSlash/withdraw)
  - `ERC8004RegistryAdapter` (syncs `syntrophic.*` metadata keys)
- Working frontend in `frontend/`:
  - explorer experience for Syntrophic trust context
- Autonomous build artifacts in `agent-logs/`:
  - `agent.json`
  - `agent_log.json`
  - `ACTIVITY_LOG.md`
  - `CONVERSATION_LOG.md`
  - `TOOL_USAGE.md`

## Judge Fast-Path (3-5 Minutes)

1. Read [docs/SBP_Base_Mainnet_Demo_Report.md](docs/SBP_Base_Mainnet_Demo_Report.md) for deployment tx hashes.
2. Confirm metadata on Base:

```bash
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.status" --rpc-url https://mainnet.base.org
cast call 0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248 "isBonded(uint256)(bool)" 32055 --rpc-url https://mainnet.base.org
```

3. Run protocol tests:

```bash
cd protocol
forge test --offline
```

Expected local result: `17 passed, 0 failed`.

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

## Mapping to Synthesis Evaluation Dimensions

1. **Problem Clarity**
- Solves day-zero trust for agents that lack history.
- Addresses spam/sybil pressure in cross-platform agent environments.

2. **Technical Execution**
- Mainnet deployment + transaction receipts + reproducible verification.
- Tested contract behavior covering bond/slash/withdraw/adapter sync.

3. **AI x Crypto Integration**
- Crypto is load-bearing: staking economics + on-chain lifecycle + immutable verification.
- AI trust updates are represented as signed attestations consumed on-chain.

4. **Originality & Differentiation**
- ERC-8004 identity + bonded trust extension + ROFL-attested validation.
- Portable metadata signal, not a platform-locked badge.

5. **Impact Potential**
- Enables immediate, portable trust signaling for new agents.
- Makes malicious identity farming economically costlier.

6. **Completeness & Shipping Quality**
- Contracts, tests, docs, live proof, and frontend are all in-repo.
- Agent execution artifacts are present for autonomous track evaluation.

## Protocol Labs Alignment

### Agents With Receipts
- Real on-chain integration with ERC-8004-compatible metadata writes.
- Receipts and verification workflow documented in `docs/`.

### Let the Agent Cook
- Agent manifest and execution logs included in `agent-logs/`.
- End-to-end build artifacts show discover -> plan -> execute -> verify style workflow.

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
