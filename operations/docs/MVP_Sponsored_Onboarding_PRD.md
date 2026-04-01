# Syntrophic Sponsored Onboarding MVP
## Product Requirements Document

**Date:** 2026-03-31  
**Status:** Active build spec  
**Audience:** Product, protocol, frontend, backend, agent-platform, and ops contributors

---

## 1. Product Thesis

Syntrophic should not ask a new agent owner to piece together wallet funding, ERC-8004 registration, IPFS pinning, and Base ETH bonding manually.

The MVP product is:

**Launch a bonded ERC-8004 agent with one x402 payment.**

The user or agent pays once in stablecoin through x402. Syntrophic then performs the Base mainnet registration and ETH bond sponsorship flow on the user's behalf, while the resulting ERC-8004 identity is owned by the user's wallet.

This preserves the protocol's crypto-economic semantics:
- x402 is the payment rail,
- Base is the on-chain execution rail,
- the SRP bond remains real ETH locked in the vault,
- the user still ends up owning the ERC-8004 identity and bonded position.

---

## 2. MVP Outcome

An OpenClaw-compatible agent or human operator can:

1. prepare a valid ERC-8004 registration payload,
2. pay one x402 quote,
3. receive an ERC-8004 agent on Base that is already bonded in Syntrophic,
4. get a proof bundle with tx hash, agent ID, and verification links.

---

## 3. MVP Scope

### In Scope

- Base mainnet only
- New agent onboarding only
- One x402 payment covering:
  - ERC-8004 registration support
  - IPFS pinning
  - Base execution gas
  - SRP bond principal
  - small Syntrophic service fee
- Sponsored on-chain execution by Syntrophic
- New sponsor-aware onboarder contract
- Job-based orchestration with idempotency and replay safety
- Browser/web flow
- Agent/OpenClaw-compatible API + MCP/CLI surface
- Proof bundle output

### Explicitly Out of Scope for MVP

- Multi-chain writes
- Sponsored bonding for already-registered ERC-8004 agents
- Marketplace listing flows
- Feedback-to-score automation changes
- Full account-abstraction / embedded-wallet stack
- Backend custody of user identity keys

---

## 4. Why This Scope Is Correct

This scope concentrates on the highest-leverage wedge:

- it removes the ETH acquisition problem,
- it removes the "register now, bond later" drop-off,
- it gives OpenClaw and other agents a single clean launch primitive,
- it aligns with the current contract model more cleanly than trying to make x402 settle the bond directly.

Current protocol constraints make this important:

- the SRP vault still requires ETH `msg.value` for the bond,
- the current onboarder is caller-centric rather than sponsor-centric,
- existing-agent bonding still assumes the caller owns the ERC-8004 NFT at execution time.

---

## 5. User Stories

### Human Operator

As a human operator,
I want to pay one quoted amount,
so that my agent is registered and bonded without needing to manually acquire ETH or manage multiple steps.

### OpenClaw Agent

As an autonomous agent using an operator-approved tool,
I want to submit profile data and pay once through x402,
so that I can become an ERC-8004 identity with Syntrophic trust in one job.

### Syntrophic Ops

As Syntrophic,
we want one deterministic onboarding workflow with receipts and replay safety,
so that sponsored launches can be audited, retried safely, and supported operationally.

---

## 6. MVP User Flow

### Base-First Sponsored Launch

1. User or agent prepares profile inputs:
   - name
   - description
   - one or more service endpoints
   - optional image/logo
2. Syntrophic validates and composes the ERC-8004 registration file.
3. Client requests an onboarding quote.
4. Server returns a locked quote in USDC terms.
5. Client pays via x402.
6. Syntrophic verifies the payment and starts the onboarding job.
7. Syntrophic pins metadata to IPFS.
8. Syntrophic calls the sponsor-aware onboarder contract on Base.
9. Contract registers the ERC-8004 agent, bonds it with ETH, and transfers ownership to the beneficiary wallet.
10. Client receives a proof bundle:
   - chain ID
   - agent ID
   - tx hash
   - bond status
   - metadata status
   - explorer links

---

## 7. Functional Requirements

### Registration Payload

- Must produce ERC-8004-compatible metadata
- Must include Syntrophic-compatible trust declarations
- Must pass validation before any payment capture is treated as executable

### Payment

- Must support x402 as the client payment mechanism
- Must be one payment per launch intent
- Must bind payment to an idempotent launch request

### On-Chain Execution

- Must register and bond in a single transaction on Base
- Must transfer ERC-8004 ownership to the beneficiary wallet
- Must emit enough event data for deterministic verification

### Job Handling

- Must support idempotency keys
- Must expose queued/running/succeeded/failed states
- Must preserve replay metadata and error context

### Proof and Verification

- Must return a machine-readable proof bundle
- Must expose status checks after submission
- Must distinguish vault truth from metadata/indexer propagation lag

---

## 8. Non-Functional Requirements

- No backend custody of final user identity keys
- Safe retry behavior for partial failures
- Actionable failure messages
- Rate limiting and abuse controls
- Audit trail per onboarding request
- Clear quote expiry and payment validity windows

---

## 9. Success Metrics

### Primary

- Completed launches per week
- Median time from quote request to bonded status
- Quote-to-launch conversion rate
- Failed launch rate

### Secondary

- Cost recovery ratio on sponsored onboarding
- Percentage of launches completed without manual intervention
- Percentage of launched agents with complete metadata and visible bonded status

---

## 10. MVP Chain Strategy

### Launch Target

- **Base mainnet** is the only MVP write target.

Why:
- current SRP deployments already live on Base,
- current explorer and operational flows are Base-native,
- bonding economics are viable on Base,
- x402-funded sponsorship is tractable there today.

### Future Chain Expansion

The architecture must be **multi-chain-ready** even though MVP writes only to Base.

Future product direction:
- user or agent may select one or more target chains,
- Syntrophic accepts one x402 payment quote for the selected launch bundle,
- Syntrophic executes per-chain child jobs using pre-funded treasury balances on each chain,
- the proof bundle returns one result per chain.

Important:
- this should be framed as **single-payment multi-chain launch**,
- not strict blockchain-level atomic settlement across chains.

Candidate future chains may include BNB Smart Chain, Ethereum, or others based on scanner/discovery value and economics. The chain bundle decision should stay product-configurable rather than hard-coded into the MVP.

---

## 11. Deferred Scope That Must Not Be Forgotten

### A. Sponsored Bonding for Already-Registered Agents

This is intentionally deferred from MVP.

Future goal:
- a user with an already-registered ERC-8004 agent should be able to approve sponsorship and pay via x402,
- Syntrophic should then bond that existing agent without forcing the user to source ETH directly.

Likely direction:
- new vault authorization path using owner-signed intent,
- or a dedicated sponsor-compatible bonding function.

This is a planned follow-up, not abandoned scope.

### B. Multi-Chain Launch Bundles

Also deferred from MVP, but explicitly preserved.

Future goal:
- one quote,
- one x402 payment,
- one parent job,
- multiple chain executions,
- one aggregated proof bundle.

---

## 12. Build-Ready Doc Set

This PRD is the top-level product lock. The engineering build set for this MVP is:

- `MVP_Sponsored_Onboarding_PRD.md`
- `MVP_Sponsored_Onboarding_Contract_Spec.md`
- `MVP_Sponsored_Onboarding_API_Job_Spec.md`
- `MVP_Sponsored_Onboarding_Agent_Integration_Spec.md`
- `MVP_Sponsored_Onboarding_Build_Backlog.md`

---

## 13. Final MVP Decision

Build **Base-first sponsored onboarding for new agents** now.

Do not block MVP on:
- multi-chain writes,
- embedded wallet stacks,
- existing-agent sponsored bonding.

But preserve all interfaces and data models so those can be added cleanly in the next phase.
