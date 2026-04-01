# Syntrophic Sponsored Onboarding MVP
## Build Backlog and Execution Plan

**Date:** 2026-03-31  
**Status:** Active implementation backlog

---

## 1. Build Order

The fastest safe path is:

1. lock docs and interfaces
2. implement sponsor-aware contract
3. implement quote + launch + job APIs
4. implement IPFS validation/publish path
5. implement proof verification and status reads
6. implement web flow
7. implement OpenClaw/public skill wrapper

---

## 2. Milestone 0 — Design Lock

### Deliverables

- product lock for Base-first new-agent flow
- contract interface lock for `SyntrophicSponsoredOnboarder`
- API/job contract lock
- operation ID additions

### Done When

- docs are committed,
- contract/API names are stable enough to start coding.

---

## 3. Milestone 1 — Contract Foundation

### Tasks

1. Add `SyntrophicSponsoredOnboarder.sol`
2. Add full Foundry tests
3. Add deploy script
4. Add root scripts for deploy/verify if needed

### Acceptance

- new contract compiles,
- tests pass,
- event emits `agentId`, sponsor, beneficiary, and payment ref,
- ownership and staker semantics are correct.

---

## 4. Milestone 2 — Backend Workflow Core

### Tasks

1. Create onboarding quote builder
2. Create profile validator
3. Create IPFS publish wrapper
4. Create onboarding job runner
5. Create Base transaction executor
6. Persist job state and artifacts

### Acceptance

- one paid launch intent results in one deterministic job,
- replay with same idempotency key does not duplicate execution,
- proof bundle is stored and queryable.

---

## 5. Milestone 3 — API Surface

### Tasks

1. `POST /v1/onboarding/quotes`
2. `POST /v1/onboarding/launches`
3. `GET /v1/jobs/{job_id}`
4. `GET /v1/agents/{chain_id}/{agent_id}/status`

### Acceptance

- quote flow works end to end,
- launch flow returns x402-required or queued state correctly,
- status endpoint exposes final proof and verification state.

---

## 6. Milestone 4 — Frontend MVP

### Tasks

1. new onboard page
2. profile form
3. quote review UI
4. payment handoff UI
5. polling/progress state UI
6. proof/success page

### Acceptance

- a human can complete Base launch from the browser,
- the UI clearly explains what is being paid for,
- the proof bundle is visible and shareable.

---

## 7. Milestone 5 — Agent/OpenClaw Surface

### Tasks

1. MCP wrapper for `syntrophic_launch_bonded_agent`
2. CLI wrapper
3. documentation/examples for agent operators

### Acceptance

- an agent platform can trigger the same workflow without bespoke integration,
- tool output is machine-readable and human-readable.

---

## 8. Required Repo Documentation Updates

Alongside implementation, keep these updated:

- `Workflow_Operation_Catalog.md`
- `API_MCP_CLI_Contracts_Draft.md`
- root `README.md` if public onboarding becomes available
- `SKILL.md` once agent-facing tooling is ready

---

## 9. Explicit Deferred Backlog

These are planned next, not dropped:

### Deferred A — Existing-Agent Sponsored Bonding

- new vault authorization model
- future endpoint and tool surface
- proof and payment flow for existing ERC-8004 agents

### Deferred B — Multi-Chain Launch Bundles

- parent job with per-chain child jobs
- configurable chain selection at request time
- aggregated quote and proof bundle
- likely future chains may include BNB Smart Chain, Ethereum, or others based on economics and ecosystem value

### Deferred C — Post-Launch Marketplace Loop

- x402-gated services
- bonded-agent listing
- search/discovery boosts tied to bonded status

---

## 10. Immediate First Coding Tasks

Start here:

1. implement `SyntrophicSponsoredOnboarder.sol`
2. add tests for sponsor/beneficiary semantics
3. add `scripts/verify-base.sh`-style verification helper for the new contract path
4. scaffold API request/response schemas for quote and launch

This is the shortest path from docs to executable progress.
