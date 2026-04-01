# PL Genesis Submission - Syntrophic Reputation Protocol

## One-Line Thesis

Syntrophic turns ERC-8004 identity into a portable, bonded trust signal so agents can become verifiable from day zero instead of waiting to accumulate post-interaction reputation.

## What We Built

Syntrophic is a live Base mainnet protocol and product surface that combines:
- ERC-8004 agent identity registration
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

This project is strongest when judges understand it as infrastructure for trustworthy autonomous agents, not just a reputation dashboard.

Syntrophic builds a foundational trust layer for the agent internet:
- ERC-8004 gives the agent a portable on-chain identity
- SRP adds economic commitment and slashable accountability
- x402 makes onboarding and agent payments smoother
- the verification page and metadata turn trust into something humans and agents can inspect across apps

### 🔐 Agents With Receipts — 8004

This is the clearest and strongest fit.

Why it matches the challenge:
- the system uses real ERC-8004 on-chain transactions on Base mainnet
- it works across the identity, trust, and validation surface of the ERC-8004 ecosystem
- it gives agents a trust framework that is portable, verifiable, and machine-readable
- it includes a structured autonomous onboarding path through the public skill and helper flow

What judges can verify:
- live ERC-8004 registration and trust-linked contracts on Base
- canonical `syntrophic.*` metadata written back into ERC-8004
- public agent onboarding via `https://syntrophic.md/skill.md`
- real proof bundles with `agent_id`, `tx_hash`, and verification links

Why this is differentiated:
- this is not just agent discovery
- this is not just profile storage
- this is a trust primitive that makes agents verifiable economic actors from day zero

### 🤖 Agent Only : Let the agent cook

This is also a top-tier fit because the repo demonstrates a real autonomous build-and-ship loop, not a scripted agent demo.

How it matches the challenge requirements:
- discover → plan → execute → verify → submit is documented across the repo artifacts
- the agent produced code, deployments, docs, and presentation assets
- the system includes tool orchestration, retries, safety checks, and human escalation at high-risk points
- the project evolved from Synthesis into PL Genesis instead of stopping at a one-off demo

Direct evidence in the repo:
- `agent-logs/agent.json`
- `agent-logs/agent_log.json`
- `agent-logs/ACTIVITY_LOG.md`
- `agent-logs/CONVERSATION_LOG.md`
- `agent-logs/TOOL_USAGE.md`

Public agent evidence:
- MoltBook presence: [https://www.moltbook.com/u/syntrophicagent222](https://www.moltbook.com/u/syntrophicagent222)

Additional autonomous media-production evidence:
- `video-workflow/` contains an agent-operated pipeline that generates the hackathon demo with HTML slides, synthesized voiceover, browser-driven web capture, and final video composition
- key files include:
  - `video-workflow/README.md`
  - `video-workflow/WORKFLOW.md`
  - `video-workflow/GENERATE-3MIN.md`
  - `video-workflow/input/`
  - `video-workflow/scripts/`
  - `video-workflow/output/syntrophic-3min-presentation.mp4`
  - `video-workflow/output/syntrophic-final-with-voice.mp4`

Why that matters:
- the agent is not only building the protocol
- it is also preparing its own explanatory and submission artifacts using real tools

### AI & Robotics

This is a strong fit because Syntrophic is directly about safe, accountable, collaborative autonomous systems.

Why it matches the track:
- it addresses agent-to-agent trust and coordination, not just raw model capability
- it makes agents verifiable economic actors through ERC-8004 identity plus bonded stake
- it uses x402 as a machine-payment rail in the onboarding and commerce path
- it supports human-in-the-loop oversight through confirmation, helper handoff, challenge windows, and explicit guardrails

What problem it solves in AI systems:
- agents currently start with no trust history
- platforms can show soft badges, but those are not portable or machine-verifiable
- Syntrophic turns trust into a shared, inspectable system other agents and apps can actually consume

### Crypto

This is a strong fit because crypto is load-bearing in the design, not decorative.

Why it matches the track:
- the protocol creates a new coordination mechanism around agent reputation and economic commitment
- the bond, slash, cooldown, and withdrawal lifecycle are the core enforcement mechanism
- trust is expressed as on-chain state, not an off-chain score hidden behind an API
- x402 extends that into agent-native payment and onboarding UX

Why this matters for collective action:
- agents that want trust must post collateral
- bad behavior becomes economically punishable
- trust becomes reusable across ecosystems instead of siloed inside one app
- this is exactly the kind of new economic and governance surface crypto is good at creating

### Lit Protocol: NextGen AI Apps

This is the weakest of our target fits in the current codebase, and judges should understand it as a forward-looking extension rather than the primary story today.

Why it is directionally aligned:
- Syntrophic is already about agent wallet control, programmable payment paths, and trust-aware autonomous action
- the helper-handoff flow makes the need for stronger decentralized key management very clear
- Lit-style programmable signing and guarded agent wallets would be a natural next step for making x402-capable agents safer and more autonomous

Honest current status:
- there is no direct Vincent or Lit Protocol V1 (Naga) integration in this repository today
- so this should not be presented as a completed primary integration bounty

Best way to frame it:
- Syntrophic is highly compatible with the Lit thesis
- but the current shipped work is stronger in ERC-8004, Agent-Only, AI & Robotics, and Crypto

### Fresh Code

Fresh Code is not a sponsor technology track; it is the category that evaluates whether meaningful new code was built during PL Genesis.

This project fits Fresh Code because:
- the codebase was materially extended during this cycle
- the current submission includes new sponsored onboarding contracts, x402 flow, helper tooling, proof-bundle logic, updated docs, and demo surfaces
- this is not just a resubmission of a static earlier repo

The strongest Fresh Code argument is:
- we took an existing trust protocol concept
- expanded it into a real onboarding product
- added agent-first onboarding, x402-funded flow, sponsored registration/bonding, and live demo infrastructure
- and shipped those additions into the current Base mainnet and website experience

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
