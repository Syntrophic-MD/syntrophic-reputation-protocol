# Roadmap and Open Gaps

This roadmap captures what should be implemented next to turn current scripts into production-grade services.

## Phase 1: Service Readiness

1. Normalize operation runner
- Build one internal runner abstraction for all operation IDs.
- Add consistent job state transitions: `queued`, `running`, `succeeded`, `failed`.

2. Add idempotency and replay safety
- Require idempotency keys for all write operations.
- Store deterministic replay metadata for each job.

3. Introduce profile validation gate
- Validate ERC-8004 required fields before IPFS publish.
- Fail fast before any on-chain write.

## Phase 2: API and Website Integration

1. Onboarding APIs for Syntrophic.MD
- Signup with wallet.
- Register ERC-8004 profile with image and metadata.
- Return verification status and pending tasks.

2. Bonding APIs
- One-click bond flow with preflight checks and clear failure modes.
- Separate "bond only" and "bond + metadata propagation" modes.

3. Status and observability APIs
- Agent registration status.
- Bond status.
- Metadata propagation status to scanner/indexer.

## Phase 3: Feedback and Stashing Reliability

1. Feedback wrapper alignment
- Document exact feedback payload semantics SBP consumes.
- Provide explicit wrapper endpoint and MCP tool for compatible writes.

2. Stashing trigger governance
- Formalize who may trigger stashing.
- Enforce signer and role checks to match protocol intent.

3. Automatic trigger flow
- Define deterministic trigger path when score crosses threshold.
- Add audit trail of the score transition and trigger source.

## Known Design and UX Gaps

- Bonding and metadata propagation are not always perceived as atomic by users.
- Scanner/indexer lag can misrepresent immediate state after successful on-chain writes.
- Feedback compatibility expectations are not obvious without deep protocol context.
- Role/signature governance around stashing should be made explicit in docs and code guards.

## Documentation Debt To Keep Current

- Keep operation catalog in sync with scripts and future services.
- Keep API/MCP/CLI contracts synced with implementation.
- Keep incident and remediation docs linked to concrete code changes.

## Definition of Done for Productionization

- Every operation ID implemented in API + MCP + CLI.
- Full dry-run and idempotency support for all writes.
- End-to-end onboarding flow from wallet signup to bonded status.
- Deterministic, queryable status for registration, bonding, and feedback effect.
