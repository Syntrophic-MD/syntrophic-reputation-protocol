# AGENTS.md - Syntrophic Agent Operations Guide

This file is for coding agents and automation working inside this repository.

## Mission

Syntrophic extends ERC-8004 identity with a bonded trust layer and sponsored onboarding flow so agents can become verifiable from day zero on Base.

## Repo Layout

- `protocol/` — Foundry contracts, scripts, and tests
- `frontend/` — Next.js explorer, onboarding demo UI, public `skill.md`
- `docs/` — protocol draft, reports, demo scripts, threat model
- `scripts/` — repo-level setup, validation, and verification helpers
- `agent-logs/` — hackathon/autonomous operation evidence

## Canonical User-Facing Docs

- Public product overview: `README.md`
- Evaluator / hackathon submission: `PL_GENESIS_SUBMISSION.md`
- Public agent skill: `frontend/public/skill.md`
- ERC draft: `docs/ERC-Syntrophic-Draft.md`

Do not recreate a second root-level `SKILL.md`. The public skill source of truth is `frontend/public/skill.md`, served at `https://syntrophic.md/skill.md`.

## Current Live Base Mainnet Stack

- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ERC8004RegistryAdapter V2: `0x2ADF396943421a70088d74A8281852344606D668`
- SRPVault V2: `0xFdB160B2B2f2e6189895398563D907fD8239d4e3`
- SyntrophicOnboarder: `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4`
- SyntrophicSponsoredOnboarder: `0x7e29c63E8e30Fa104B448796dcb6f1355c3C0485`
- Legacy V1 vault for agent `#222`: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`

## Current Product Surface

1. Base-native bonding and metadata sync
2. Sponsored onboarding for new ERC-8004 agents
3. x402-gated launch route and helper flow
4. Explorer UI for bonded trust context
5. Public skill-based onboarding entrypoint for agents

## Important Contract Semantics

- `SRPVault` is the core trust primitive.
- `bondFor(agentId, beneficiary)` is the sponsored/factory bonding path.
- `bondStrict(agentId)` requires metadata write authorization up front.
- `ERC8004RegistryAdapter` writes canonical `syntrophic.*` metadata and supports `syncBondMetadata`.
- `SyntrophicSponsoredOnboarder.onboardFor(...)` is the current one-transaction sponsored register + bond flow.

## Frontend / Onboarding Notes

- `frontend/public/skill.md` is the public onboarding instruction file.
- `/onboard` is the x402 demo/operator page, not the canonical fully autonomous UX.
- Browsers can reliably create quotes, but paid launch is designed for an x402-capable helper or agent runtime.
- `frontend/scripts/syntrophic-launch.mjs` is the main helper CLI.

## Root Commands

```bash
npm run setup:demo
npm run validate
npm test
npm run build
npm run verify:all
```

Current local expectation:
- `npm test` => `41 passed, 0 failed`

## Working Rules

- Preserve the public skill URL contract: `https://syntrophic.md/skill.md`
- Prefer Base-first assumptions unless explicitly doing future-scope planning
- Keep evaluator-facing copy out of `AGENTS.md`
- Put public narrative in `README.md`
- Put hackathon/judge framing in `PL_GENESIS_SUBMISSION.md`
- Keep secrets out of git

## Known Constraints

- ROFL attestation authority is still single-signer
- Bond amount is hackathon-tuned
- x402 flow is implemented but still best demonstrated with a helper/runtime, not a plain browser
- Explorer filtering still depends partly on available indexer behavior

## Best References Before Editing

- `README.md`
- `PL_GENESIS_SUBMISSION.md`
- `docs/ERC-Syntrophic-Draft.md`
- `docs/SRP_Base_Mainnet_Demo_Report.md`
- `docs/THREAT_MODEL.md`
- `frontend/public/skill.md`
