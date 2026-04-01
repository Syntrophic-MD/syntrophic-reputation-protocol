# Service Architecture Foundation

## Goal

Define stable boundaries so current script workflows can be wrapped by:
- HTTP APIs (for Syntrophic.MD backend)
- MCP tools (for agent/operator assistants)
- CLI commands (for ops and manual fallback)

without changing core workflow semantics.

## Domain Modules

1. Identity and Wallets
- Agent wallet generation
- Gas top-up and funding checks
- Ownership verification

2. Profile and Metadata
- Profile payload validation
- Image generation orchestration (provider-agnostic)
- IPFS publish and URI lifecycle

3. ERC-8004 Registry
- Register agent IDs
- Set/update `tokenURI`
- Query owner, metadata, and registration health

4. SBP Bonding
- Bond/unbond actions
- Adapter authorization checks
- Bond status verification

5. Feedback and Scoring
- Write ERC-8004 feedback
- Query feedback aggregates and SBP-compatible score/review state
- Trigger/monitor stashing eligibility checks

6. Jobs and Observability
- Async job execution
- Structured logs
- Transaction traceability and replay

## Stable Operation IDs

Use operation IDs as the canonical language across API, MCP, and CLI:

- `wallet.create_batch`
- `wallet.fund_batch`
- `profile.generate_assets`
- `profile.publish_ipfs`
- `registry.register_batch`
- `registry.set_agent_uri`
- `registry.verify_agent`
- `sbp.bond_batch`
- `sbp.unbond_batch`
- `sbp.verify_status`
- `feedback.submit`
- `feedback.verify_effect`

## Separation of Concerns

- Workflow engine: deterministic execution steps and transaction order.
- Interface adapters: API route handlers, MCP tool wrappers, CLI commands.
- State store: job records, operation metadata, and audit logs.
- Secret manager: RPC keys, private keys, Pinata credentials, signer material.

This separation allows scripts to become internal executors while public surfaces remain consistent.

## Required Shared Capabilities

- Idempotency keys for all write operations.
- Dry-run mode for all mutation workflows.
- Preflight checks before every on-chain write.
- Deterministic output artifacts for each operation.
- Retry strategy with safe re-entry points.

## Suggested Future Repo Direction (Documentation-Only)

Current:
- scripts and profiles are execution-first.

Future target:
- `services/core/` for reusable workflow logic
- `services/http/` for API routes
- `services/mcp/` for MCP tools
- `services/cli/` for command wrappers
- `contracts/` for request/response schemas
- `jobs/` for async execution and queue workers

No migration is required now; this document defines the target boundaries for gradual adoption.
