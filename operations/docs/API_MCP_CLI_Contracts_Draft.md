# API, MCP, CLI Contracts Draft

This draft standardizes payloads and behavior for future wrappers around existing workflows.

## Common Request Envelope

```json
{
  "idempotency_key": "string-unique-per-intent",
  "dry_run": false,
  "requested_by": "user-or-service-id",
  "context": {
    "network": "base",
    "chain_id": 8453
  },
  "params": {}
}
```

## Common Async Response Envelope

```json
{
  "operation_id": "registry.register_batch",
  "job_id": "job_01H...",
  "status": "queued",
  "created_at": "2026-03-27T00:00:00Z"
}
```

## Common Job Status Shape

```json
{
  "job_id": "job_01H...",
  "operation_id": "sbp.bond_batch",
  "status": "running",
  "started_at": "2026-03-27T00:00:00Z",
  "completed_at": null,
  "result": null,
  "error": null,
  "artifacts": {
    "report_json": "path-or-url",
    "summary_csv": "path-or-url"
  }
}
```

## Operation Contracts

## `registry.register_batch`

Request `params`:

```json
{
  "count": 5,
  "fund_amount": "0.000005ether",
  "register_mode": "empty|uri|uri-via-set",
  "uri_prefix": "https://...",
  "uri_list": ["ipfs://..."],
  "gas_price_wei": "6000000"
}
```

Result:

```json
{
  "wallets": [{"address": "0x..."}],
  "registrations": [{"agent_id": 36105, "tx_hash": "0x..."}],
  "funding": [{"address": "0x...", "tx_hash": "0x..."}],
  "summary": {"created": 5, "registered": 5}
}
```

## `registry.set_agent_uri`

Request `params`:

```json
{
  "agent_id": 36106,
  "new_uri": "ipfs://Qm..."
}
```

Result:

```json
{
  "agent_id": 36106,
  "tx_hash": "0x...",
  "onchain_uri": "ipfs://Qm..."
}
```

## `sbp.bond_batch`

Request `params`:

```json
{
  "agent_ids": [32055, 36105, 36109, 36110],
  "gas_price_wei": "6000000",
  "bond_gas_limit": 250000
}
```

Result:

```json
{
  "results": [
    {"agent_id": 32055, "bonded_before": true, "tx_hash": null},
    {"agent_id": 36105, "bonded_before": false, "tx_hash": "0x..."}
  ]
}
```

## `feedback.submit`

Request `params`:

```json
{
  "from_agent_id": 32055,
  "to_agent_id": 36110,
  "score": 20,
  "comment": "optional",
  "feedback_type": "positive|negative|neutral"
}
```

Result:

```json
{
  "tx_hash": "0x...",
  "from_agent_id": 32055,
  "to_agent_id": 36110
}
```

## MCP Tool Contract Pattern

Each MCP tool should mirror one operation ID:

- Tool name equals operation ID with dots replaced by underscores.
- Input equals `params` plus optional `dry_run`.
- Output equals synchronous result or async job handle.

Example mapping:

- `registry_register_batch`
- `registry_set_agent_uri`
- `sbp_bond_batch`
- `feedback_submit`

## CLI Contract Pattern

Use one command group per domain:

- `syntrophic profile ...`
- `syntrophic registry ...`
- `syntrophic sbp ...`
- `syntrophic feedback ...`

Each command must support:

- `--dry-run`
- `--idempotency-key`
- `--output json|table`

## Error Model

Standardized error shape:

```json
{
  "error": {
    "code": "OWNER_MISMATCH",
    "message": "Signer is not owner of agent ID 36109.",
    "retryable": false,
    "details": {}
  }
}
```

Recommended codes:

- `INVALID_INPUT`
- `MISSING_SECRET`
- `INSUFFICIENT_FUNDS`
- `OWNER_MISMATCH`
- `ONCHAIN_REVERT`
- `INDEXER_STALE`
- `EXTERNAL_PROVIDER_ERROR`
