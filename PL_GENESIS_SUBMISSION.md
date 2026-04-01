# PL Genesis Submission - Syntrophic Reputation Protocol

## One-Line Thesis

Syntrophic turns ERC-8004 identity into a portable, bonded trust signal so agents can become verifiable from day zero instead of waiting to accumulate post-interaction reputation.

## What We Built

Syntrophic is a live Base mainnet protocol and product surface that combines:
- ERC-8004 agent identity
- an ETH-backed reputation bond
- ROFL-signed trust updates
- canonical `syntrophic.*` metadata written back into ERC-8004
- sponsored onboarding funded through x402

The product outcome is simple:

an agent can register, bond, and receive a public verification link that behaves like a decentralized verified badge.

## Why It Matters

Agent ecosystems have a day-zero trust problem:
- new agents have no history, so they get filtered out immediately
- cheap identity rotation makes spam and impersonation easy
- platform-native badges are siloed and non-portable

Syntrophic adds economic commitment directly to ERC-8004 identity. An app no longer has to trust a platform claim or an off-chain badge; it can inspect a bonded agent identity and the trust metadata on-chain.

## Live Proof

### Base Mainnet Contracts

- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ERC8004RegistryAdapter V2: `0x2ADF396943421a70088d74A8281852344606D668`
- SRPVault V2: `0xFdB160B2B2f2e6189895398563D907fD8239d4e3`
- SyntrophicOnboarder: `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4`
- SyntrophicSponsoredOnboarder: `0x7e29c63E8e30Fa104B448796dcb6f1355c3C0485`
- Legacy V1 vault for agent `#222`: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`

### Live Surfaces

- Website: [https://www.syntrophic.md](https://www.syntrophic.md)
- Public skill: [https://syntrophic.md/skill.md](https://syntrophic.md/skill.md)
- Explorer: [https://www.syntrophic.md/explore](https://www.syntrophic.md/explore)
- x402 demo page: [https://www.syntrophic.md/onboard](https://www.syntrophic.md/onboard)

### Tests

Current local result:
- `npm test` => `41 passed, 0 failed`

## What Is Actually Implemented

### 1. Bonded Trust Primitive

`SRPVault` implements:
- `bond`
- `bondFor`
- `bondStrict`
- score updates
- slash flow
- unstake / withdraw lifecycle

### 2. Portable On-Chain Trust State

`ERC8004RegistryAdapter` syncs canonical:
- `syntrophic.validator`
- `syntrophic.status`
- `syntrophic.score`
- `syntrophic.reviewCount`
- `syntrophic.updatedAt`

### 3. Sponsored Onboarding

`SyntrophicSponsoredOnboarder` lets a sponsor:
- register a new ERC-8004 agent
- post the bond on behalf of a beneficiary
- transfer the final ERC-8004 identity to that beneficiary

### 4. x402-Funded Demo Flow

The current demo flow:
1. creates a quote
2. prices bond + gas + IPFS + fee in USDC
3. uses x402 as the payment rail
4. executes sponsored Base onboarding
5. returns a proof bundle and verification line

### 5. Agent-First Onboarding

The public skill at `https://syntrophic.md/skill.md` is the main autonomous onboarding interface.

The agent:
- gathers profile details
- creates a quote
- decides whether it can self-pay
- either completes payment or hands off to a helper
- returns proof and a verification link

## Demo Story

The strongest product story is:

1. an agent reads the Syntrophic skill
2. it prepares a real profile and beneficiary wallet
3. it creates a quote
4. payment happens through x402
5. Syntrophic sponsors the Base execution
6. the agent ends up as a bonded ERC-8004 identity with a public verification page

That is the decentralized equivalent of a verified badge for agents.

## Track Fit

### Agents With Receipts / ERC-8004

This is the best fit.

- live ERC-8004 integration
- portable on-chain metadata
- real trust primitive, not just profile storage
- autonomous onboarding path for agents

### Agent-Only / Let The Agent Cook

The repo includes autonomous build and operations evidence in:
- `agent-logs/agent.json`
- `agent-logs/agent_log.json`
- `agent-logs/ACTIVITY_LOG.md`
- `agent-logs/CONVERSATION_LOG.md`
- `agent-logs/TOOL_USAGE.md`

### Crypto

Crypto is load-bearing here:
- bond economics
- slash / cooldown enforcement
- on-chain verification
- x402 payment integration

### AI & Robotics

Syntrophic addresses safe, accountable agent coordination:
- public stake
- verifiable identity
- transparent trust updates
- human- and machine-readable trust state

## Quick Evaluator Path

1. Read [docs/SRP_Base_Mainnet_Demo_Report.md](docs/SRP_Base_Mainnet_Demo_Report.md)
2. Open [https://www.syntrophic.md](https://www.syntrophic.md)
3. Open the public skill at [https://syntrophic.md/skill.md](https://syntrophic.md/skill.md)
4. Open the x402 demo page at [https://www.syntrophic.md/onboard](https://www.syntrophic.md/onboard)
5. Run:

```bash
npm test
npm run verify:all
```

## Honest Gaps

- ROFL attestation authority is still single-signer
- Bond amount is hackathon-tuned
- Multi-chain launch is future scope, not MVP
- Sponsored bonding for already-registered agents is planned, not yet live
- Browser-only x402 UX is weaker than helper/agent-assisted flow

## Canonical References

- Public overview: [README.md](README.md)
- ERC draft: [docs/ERC-Syntrophic-Draft.md](docs/ERC-Syntrophic-Draft.md)
- Base mainnet proof report: [docs/SRP_Base_Mainnet_Demo_Report.md](docs/SRP_Base_Mainnet_Demo_Report.md)
- Threat model: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md)
- Frontend docs: [frontend/README.md](frontend/README.md)
- Protocol docs: [protocol/README.md](protocol/README.md)
