# Syntrophic Sponsored Onboarding MVP
## Agent and OpenClaw Integration Specification

**Date:** 2026-03-31  
**Status:** Draft for implementation

---

## 1. Goal

Make Syntrophic onboarding feel like one tool call for agent platforms.

The ideal agent-facing action is not:
- pin metadata,
- request drip,
- register,
- bond,
- verify.

It is:

**launch a bonded ERC-8004 agent**

---

## 2. MVP Tool Surface

### Primary Tool

`syntrophic_launch_bonded_agent`

This should exist across:
- HTTP API
- MCP tool
- CLI wrapper

### Inputs

```json
{
  "beneficiary": "0xabc...",
  "name": "Scout",
  "description": "Monitors DeFi prices",
  "services": [
    {
      "type": "mcp",
      "url": "https://scout.example.com/mcp"
    }
  ],
  "image_url": "https://example.com/logo.png",
  "chain_ids": [8453]
}
```

For MVP:
- `chain_ids` must contain only Base

### Output

```json
{
  "job_id": "job_01HZ...",
  "status": "queued",
  "quote_id": "quote_01HZ..."
}
```

Follow-up status result:

```json
{
  "status": "succeeded",
  "proof_bundle": {
    "chain_results": [
      {
        "chain_id": 8453,
        "agent_id": 36150,
        "bonded": true,
        "tx_hash": "0x..."
      }
    ]
  }
}
```

---

## 3. OpenClaw Interaction Model

### Recommended UX

1. Agent gathers missing profile fields.
2. Agent shows a readable preview of the registration payload.
3. Agent requests user approval for launch.
4. Agent obtains x402 quote.
5. Agent pays or requests operator payment approval.
6. Agent polls job status.
7. Agent returns the proof bundle.

### What The Agent Should Never Need To Do In MVP

- source ETH manually,
- manage Pinata credentials,
- hold backend API keys for registration,
- run multiple separate on-chain steps for new-agent launch.

---

## 4. Required Human Approval Boundaries

Even in agent mode, these approval boundaries should remain explicit:

- profile payload approval
- quote approval
- payment approval
- final ownership wallet confirmation

That keeps the flow operator-safe while still feeling automated.

---

## 5. MCP Tool Contract

### Tool Name

`syntrophic_launch_bonded_agent`

### Behavior

- synchronous response may return x402-required or queued-job state,
- terminal response should always contain a proof bundle or a structured error.

### Error Shape

```json
{
  "error": {
    "code": "PROFILE_INVALID",
    "message": "Service URL is malformed.",
    "retryable": false
  }
}
```

Suggested error codes:

- `PROFILE_INVALID`
- `QUOTE_EXPIRED`
- `PAYMENT_REQUIRED`
- `PAYMENT_VERIFICATION_FAILED`
- `ONCHAIN_REVERT`
- `JOB_TIMEOUT`
- `STATUS_UNCERTAIN`

---

## 6. CLI Wrapper

### Proposed Command

```bash
syntrophic onboarding launch-bonded-agent \
  --beneficiary 0xabc... \
  --name "Scout" \
  --description "Monitors DeFi prices" \
  --service mcp=https://scout.example.com/mcp
```

Required CLI flags:

- `--idempotency-key`
- `--output json|table`
- `--wait`

---

## 7. Future Agent Features

These are intentionally deferred, but the interface should leave room for them:

### Sponsored Bonding for Existing Agents

Future tool:

`syntrophic_bond_existing_agent`

Purpose:
- user selects an already-registered ERC-8004 agent,
- agent obtains quote,
- user approves sponsorship,
- Syntrophic executes the bond after x402 payment.

### Multi-Chain Launch

Future input shape:

```json
"chain_ids": [8453, 56, 1]
```

Meaning:
- user or agent can choose one or more chains for launch,
- Syntrophic returns one proof bundle with one result per chain.

The actual chain list is intentionally left configurable for later product decisions.
