# Syntrophic Reputation Protocol

Syntrophic gives agents the decentralized equivalent of a verified badge.

It solves the day-zero trust problem for ERC-8004 agents and introduces a new trust modality for ERC-8004 by combining:
- ERC-8004 agent identity
- ETH-backed reputation staking on Base
- canonical `syntrophic.*` metadata
- x402-funded sponsored onboarding

The owner gives minimal necessary input, the agent does the operational work, and the result is a public verification surface any app, agent, or user can inspect.

## Overview

ERC-8004 gives agents portable identity, but identity alone does not make a new agent credible. A capable new agent can still be ignored on day one, while spam and impersonation agents can cheaply rotate identities across social and service channels. Platform-owned verification badges are not portable, not machine-verifiable across ecosystems, and can be revoked by centralized gatekeepers.

Syntrophic turns ERC-8004 identity into a portable, on-chain trust primitive. An agent owner bonds ETH against the agent’s ERC-8004 identity, creating an immediate accountability signal that can be verified from day one. On top of that trust layer, Syntrophic supports smoother onboarding for OpenClaw-like agents: an agent can gather the owner’s profile inputs, create a quote, pay through x402, complete ERC-8004 registration plus reputation bonding, and return a public verification page and reusable verification line.

## What Is Live

### Base Mainnet Stack

- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ERC8004RegistryAdapter V2: `0x2ADF396943421a70088d74A8281852344606D668`
- SRPVault V2: `0xFdB160B2B2f2e6189895398563D907fD8239d4e3`
- SyntrophicOnboarder: `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4`
- SyntrophicSponsoredOnboarder: `0x7e29c63E8e30Fa104B448796dcb6f1355c3C0485`
- Legacy V1 vault for agent `#222`: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`

### Live Product Surfaces

- Website and explorer: [https://www.syntrophic.md](https://www.syntrophic.md)
- Public skill: [https://syntrophic.md/skill.md](https://syntrophic.md/skill.md)
- x402 demo page: [https://www.syntrophic.md/onboard](https://www.syntrophic.md/onboard)
- Explore page: [https://www.syntrophic.md/explore](https://www.syntrophic.md/explore)

## Core Product Flow

The current agent-first onboarding flow is:

1. An agent reads the public skill at `https://syntrophic.md/skill.md`.
2. It gathers the beneficiary wallet and profile details.
3. It creates a quote for sponsored onboarding.
4. It either:
   - self-pays through an x402-capable runtime, or
   - hands off to a helper runtime
5. Syntrophic registers the ERC-8004 identity, posts the bond, and returns:
   - `agent_id`
   - `tx_hash`
   - `verification_url`
   - `verification_line`

This is how onboarding becomes the trust moment.

## Core Protocol Components

### `SRPVault`

The trust primitive.

- fixed `BOND_AMOUNT`
- `bond`, `bondFor`, and `bondStrict`
- slash / cooldown / unstake lifecycle
- EIP-712 ROFL-signed score and slash attestations

### `ERC8004RegistryAdapter`

The metadata bridge.

Canonical keys:
- `syntrophic.validator`
- `syntrophic.status`
- `syntrophic.score`
- `syntrophic.reviewCount`
- `syntrophic.updatedAt`

### `SyntrophicSponsoredOnboarder`

The sponsored register-and-bond path for new agents.

It:
- registers the ERC-8004 agent
- approves metadata writes
- bonds through `bondFor`
- transfers final ownership to the beneficiary
- emits a payment correlation event

### `frontend/scripts/syntrophic-launch.mjs`

The payment-capable helper CLI.

It:
- creates quotes
- handles x402-paid launch calls
- supports quote-only + handoff mode
- resumes from handoff files
- prints proof bundle outputs

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

Verify live Base state:

```bash
npm run verify:all
```

Current local expectation:
- `npm test` => `41 passed, 0 failed`

## Repository Map

- `protocol/` — Foundry contracts, scripts, and tests
- `frontend/` — Next.js app, explorer, x402 demo UI, public `skill.md`
- `docs/` — ERC draft, threat model, proof report, demo scripts
- `operations/` — strategy and planning documents
- `agent-logs/` — autonomous build and execution evidence
- `video-workflow/` — slide, voiceover, browser-capture, and final demo video pipeline

## Demo and Evaluation Assets

- Submission/evaluator overview: [PL_GENESIS_SUBMISSION.md](PL_GENESIS_SUBMISSION.md)
- ERC draft: [docs/ERC-Syntrophic-Draft.md](docs/ERC-Syntrophic-Draft.md)
- Base mainnet proof report: [docs/SRP_Base_Mainnet_Demo_Report.md](docs/SRP_Base_Mainnet_Demo_Report.md)
- Threat model: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md)
- Agent onboarding model: [docs/AGENT_ONBOARDING_FLOW.md](docs/AGENT_ONBOARDING_FLOW.md)
- Video pipeline: [video-workflow/README.md](video-workflow/README.md)

## Current Constraints

- ROFL attestation authority is still single-signer
- Bond amount is hackathon-tuned, not production-calibrated
- Browser UX is best for quote creation and proof viewing; x402 launch is smoother through an agent/helper runtime
- Multi-chain launch is future scope, not current MVP
- Sponsored bonding for already-registered agents is planned, not yet live

## Team

- Human partner: Narek Kostanyan
- Agent partner: Syntrophic Agent #222

Built at Synthesis and extended through the current PL Genesis iteration.
