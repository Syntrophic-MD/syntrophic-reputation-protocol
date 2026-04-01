# Syntrophic Sponsored Onboarding MVP
## API and Job Specification

**Date:** 2026-03-31  
**Status:** Draft for implementation  
**Depends on:** [MVP_Sponsored_Onboarding_PRD.md](MVP_Sponsored_Onboarding_PRD.md)

---

## 1. API Goal

Expose one deterministic onboarding service that:

- validates the profile,
- returns a quote,
- accepts one x402 payment,
- launches a sponsored Base onboarding job,
- returns a proof bundle and queryable status.

The API must remain compatible with future web, MCP, CLI, and OpenClaw interfaces.

---

## 2. Core MVP Operations

Add these operation IDs to the service layer:

- `onboarding.quote`
- `onboarding.launch_sponsored`
- `onboarding.get_status`
- `profile.validate`
- `profile.publish_ipfs`
- `registry.onboard_sponsored`
- `sbp.verify_status`

Deferred later:

- `sbp.bond_existing_sponsored`
- `onboarding.launch_multichain`

---

## 3. Common Request Envelope

```json
{
  "idempotency_key": "launch_2026_03_31_user123",
  "requested_by": "wallet:0xabc...",
  "context": {
    "network": "base",
    "chain_ids": [8453]
  },
  "params": {}
}
```

For MVP:
- `chain_ids` must equal `[8453]`

Future:
- multiple chain IDs may be accepted

---

## 4. Endpoint Set

### `POST /v1/onboarding/quotes`

Creates a locked onboarding quote.

Request:

```json
{
  "idempotency_key": "quote_01",
  "requested_by": "wallet:0xabc...",
  "context": {
    "network": "base",
    "chain_ids": [8453]
  },
  "params": {
    "beneficiary": "0xabc...",
    "profile": {
      "name": "Scout",
      "description": "Monitors DeFi prices",
      "image_url": "https://example.com/logo.png",
      "services": [
        {
          "type": "mcp",
          "url": "https://scout.example.com/mcp"
        }
      ]
    }
  }
}
```

Response:

```json
{
  "quote_id": "quote_01HZ...",
  "status": "quoted",
  "expires_at": "2026-03-31T18:45:00Z",
  "currency": "USDC",
  "line_items": {
    "bond_principal": "0.00001 ETH equivalent",
    "execution_gas": "estimated",
    "ipfs_pin": "fixed",
    "service_fee": "fixed"
  },
  "total_usdc": "0.18"
}
```

### `POST /v1/onboarding/launches`

Creates or resumes a sponsored onboarding job.

Behavior:
- if payment is not yet satisfied, the endpoint should return x402 payment requirements,
- after payment succeeds, the same idempotent request should create or resume the job.

Request:

```json
{
  "idempotency_key": "launch_01",
  "requested_by": "wallet:0xabc...",
  "context": {
    "network": "base",
    "chain_ids": [8453]
  },
  "params": {
    "quote_id": "quote_01HZ...",
    "beneficiary": "0xabc...",
    "profile": {
      "name": "Scout",
      "description": "Monitors DeFi prices",
      "services": [
        {
          "type": "mcp",
          "url": "https://scout.example.com/mcp"
        }
      ]
    }
  }
}
```

Async accepted response:

```json
{
  "operation_id": "onboarding.launch_sponsored",
  "job_id": "job_01HZ...",
  "status": "queued",
  "created_at": "2026-03-31T18:30:00Z"
}
```

### `GET /v1/jobs/{job_id}`

Returns job status.

Response:

```json
{
  "job_id": "job_01HZ...",
  "operation_id": "onboarding.launch_sponsored",
  "status": "running",
  "started_at": "2026-03-31T18:30:05Z",
  "completed_at": null,
  "result": null,
  "error": null,
  "artifacts": {
    "registration_file": null,
    "proof_bundle": null
  }
}
```

Successful result:

```json
{
  "job_id": "job_01HZ...",
  "operation_id": "onboarding.launch_sponsored",
  "status": "succeeded",
  "completed_at": "2026-03-31T18:31:12Z",
  "result": {
    "chain_id": 8453,
    "registry_address": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    "vault_address": "0xFdB160B2B2f2e6189895398563D907fD8239d4e3",
    "agent_id": 36150,
    "agent_uri": "ipfs://...",
    "bonded": true,
    "tx_hash": "0x...",
    "beneficiary": "0xabc..."
  },
  "artifacts": {
    "registration_file": "stored-json-or-url",
    "proof_bundle": "stored-json-or-url"
  }
}
```

### `GET /v1/agents/{chain_id}/{agent_id}/status`

Read-only verification endpoint.

Response:

```json
{
  "chain_id": 8453,
  "agent_id": 36150,
  "owner": "0xabc...",
  "is_bonded": true,
  "metadata": {
    "syntrophic_status": "BONDED",
    "syntrophic_score": 100
  },
  "indexer": {
    "visible": true,
    "lag_detected": false
  }
}
```

---

## 5. x402 Behavior

### Product Model

The x402 payment is product-atomic, not cross-chain atomic.

For MVP:
- one quote,
- one x402 payment,
- one Base execution job.

### Required Behavior

- launch requests must be idempotent across payment retries,
- payment verification must be bound to `quote_id` and `idempotency_key`,
- execution must not start twice for the same paid launch intent.

### Failure Handling

If payment succeeds but execution fails:
- job must move to `failed`,
- failure reason must be preserved,
- ops must have enough context to retry safely or refund manually.

---

## 6. Internal Job Steps

The `onboarding.launch_sponsored` job should run these deterministic steps:

1. validate quote and payment settlement
2. validate profile payload
3. build ERC-8004 registration file
4. pin registration file to IPFS
5. submit `onboardFor` transaction on Base
6. wait for receipt and decode resulting `agentId`
7. verify owner and bond state
8. record proof bundle
9. mark job succeeded

---

## 7. Proof Bundle Shape

```json
{
  "quote_id": "quote_01HZ...",
  "job_id": "job_01HZ...",
  "payment_ref": "0xabc123...",
  "chain_results": [
    {
      "chain_id": 8453,
      "agent_id": 36150,
      "tx_hash": "0x...",
      "agent_uri": "ipfs://...",
      "owner": "0xabc...",
      "bonded": true,
      "metadata_status": "BONDED"
    }
  ]
}
```

The array shape is intentional so multi-chain support can be added later without breaking clients.

---

## 8. Future Multi-Chain Extension

Future launches may accept:

```json
"chain_ids": [8453, 1, 56]
```

In that later model:
- one parent job tracks the full launch,
- one child execution runs per chain,
- one proof bundle returns one result per chain,
- the payment is still single-payment at the product layer.

Strict blockchain-level atomicity is not required for the future multi-chain design.

---

## 9. Deferred Existing-Agent Sponsorship API

Later endpoint:

### `POST /v1/sbp/bonds:sponsored`

Purpose:
- accept a user-approved sponsorship intent for an already-registered ERC-8004 agent,
- execute the bond on the user's behalf after x402 payment.

This is explicitly deferred from MVP but preserved here so the request/response model can remain compatible.
