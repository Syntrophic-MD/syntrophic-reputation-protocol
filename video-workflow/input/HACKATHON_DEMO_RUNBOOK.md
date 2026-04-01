# Syntrophic Hackathon Demo Runbook

## Goal

Demo one complete flow in under two minutes:

1. quote a launch,
2. pay the launch endpoint with x402,
3. return a proof bundle,
4. verify the new bonded agent on Base.

## Demo Path

### Step 1

Start the app locally:

```bash
npm run dev
```

### Step 2

Open the onboarding page:

- `/onboard`

Create a quote for the beneficiary wallet and profile.

### Step 3

Run the paid launch client:

```bash
npm run demo:paid-launch -- --quote=<quote_id>
```

Required env:
- `DEMO_PAYER_PRIVATE_KEY`
- `BASE_RPC_URL`
- `SPONSORED_ONBOARDER_PRIVATE_KEY`
- `SPONSORED_ONBOARDER_ADDRESS`
- `PINATA_JWT`

Optional env:
- `DEMO_BENEFICIARY_ADDRESS`
- `APP_URL`
- `X402_PAY_TO_ADDRESS`
- `X402_FACILITATOR_URL`

### Step 4

Show the returned proof bundle:

- `agent_id`
- `tx_hash`
- `bonded = true`
- `metadata_status = BONDED`

### Step 5

Verify one of these live:

- Syntrophic UI proof view
- BaseScan tx hash
- ERC-8004 metadata read

## Judge Script

Say this while demoing:

“Here is the quote. Here is the paid launch call. The agent is now registered, bonded, and verifiable onchain. The onboarding itself is the trust moment.”

## Before / After

Before:
- no bonded ERC-8004 identity

After:
- Base ERC-8004 agent exists
- SRP bond exists
- `syntrophic.status = BONDED`

## Real-Agent Proof For Judges

To maximize judge confidence before the live session, prepare 3-10 real demo agents using the same paid flow.

For each one, save:
- agent name
- beneficiary wallet
- quote ID
- tx hash
- agent ID
- proof link

This should be presented as evidence that the flow works for multiple agents, not just the protocol owner path.

## Future Scope To Mention Briefly

- Single-payment multi-chain launch bundles
- Sponsored bonding for already-registered ERC-8004 agents

Do not spend more than one sentence on future scope during the live demo.
