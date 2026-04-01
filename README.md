# Syntrophic Reputation Protocol

Syntrophic gives ERC-8004 agents a portable, bonded trust signal on Base so they can become verifiable from day zero.

## What Syntrophic Does

Syntrophic combines:
- ERC-8004 identity
- an on-chain ETH bond
- ROFL-signed trust updates
- canonical `syntrophic.*` metadata
- sponsored onboarding funded through x402

The result is a decentralized verified badge pattern for agents: a public identity, a public economic commitment, and a reusable verification link any app can inspect.

## What Is Live

### Base Mainnet Contracts

- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ERC8004RegistryAdapter V2: `0x2ADF396943421a70088d74A8281852344606D668`
- SRPVault V2: `0xFdB160B2B2f2e6189895398563D907fD8239d4e3`
- SyntrophicOnboarder: `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4`
- SyntrophicSponsoredOnboarder: `0x7e29c63E8e30Fa104B448796dcb6f1355c3C0485`
- Legacy V1 vault for agent `#222`: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`

### Product Surfaces

- `frontend/` — live explorer and x402 demo UI at [syntrophic.md](https://www.syntrophic.md)
- `protocol/` — Foundry contracts, deploy scripts, tests
- `frontend/public/skill.md` — public agent onboarding skill served at [syntrophic.md/skill.md](https://syntrophic.md/skill.md)
- `frontend/scripts/syntrophic-launch.mjs` — helper CLI for x402-capable onboarding

## Quick Start

```bash
npm run setup:demo
npm run validate
npm test
npm run build
```

Run the frontend locally:

```bash
npm run dev
```

Verify live Base deployment state:

```bash
npm run verify:all
```

Current local expectation:
- `npm test` => `41 passed, 0 failed`

## Core Protocol Components

### `SRPVault`

The trust primitive.

- fixed bond amount
- `bond`, `bondFor`, and `bondStrict`
- slash / cooldown / unstake lifecycle
- EIP-712 ROFL-signed score and slash attestations

### `ERC8004RegistryAdapter`

The metadata bridge.

Writes:
- `syntrophic.validator`
- `syntrophic.status`
- `syntrophic.score`
- `syntrophic.reviewCount`
- `syntrophic.updatedAt`

### `SyntrophicSponsoredOnboarder`

The sponsored onboarding path for new agents.

It:
- registers the ERC-8004 agent
- approves metadata writes
- bonds through `bondFor`
- transfers ownership to the beneficiary
- emits a correlation event with `paymentRef`

## Agent Onboarding Model

The public onboarding entrypoint is:

- [https://syntrophic.md/skill.md](https://syntrophic.md/skill.md)

Recommended flow:
1. The agent gathers profile details and a beneficiary wallet.
2. It creates a quote.
3. If it can pay x402 itself, it launches directly.
4. If it cannot pay, it hands off to a helper runtime.
5. The beneficiary receives a public verification link and verification line.

## Key Docs

- Evaluator / hackathon overview: [PL_GENESIS_SUBMISSION.md](PL_GENESIS_SUBMISSION.md)
- ERC draft: [docs/ERC-Syntrophic-Draft.md](docs/ERC-Syntrophic-Draft.md)
- Base mainnet proof report: [docs/SRP_Base_Mainnet_Demo_Report.md](docs/SRP_Base_Mainnet_Demo_Report.md)
- Threat model: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md)
- Frontend notes: [frontend/README.md](frontend/README.md)
- Protocol notes: [protocol/README.md](protocol/README.md)

## Current Constraints

- ROFL attestation authority is still single-signer
- Bond amount is hackathon-tuned, not production-calibrated
- Browser UX is best for quote creation and proof viewing; x402 launch is smoother with an agent/helper runtime
- Explorer bonded filtering still depends partly on available indexer behavior

## Team

- Human partner: Narek Kostanyan
- Agent partner: Syntrophic Agent #222

Built for Synthesis and evolved into the current PL Genesis submission.
