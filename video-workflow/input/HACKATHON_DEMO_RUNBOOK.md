# Syntrophic Hackathon Demo Runbook

## Goal

Demo one complete flow in under two minutes:

1. create an onboarding quote,
2. complete the paid launch from a helper runtime,
3. return a proof bundle,
4. verify the new bonded agent on Base.

## Demo Path

### Step 1

Open the live website:

- `https://syntrophic.md`

Show:
- `Onboard Agent`
- `Explore Agents`
- the prompt copy dialog

### Step 2

Open the x402 demo page:

- `https://syntrophic.md/onboard`

Fill:
- beneficiary wallet
- agent name
- description
- primary service URL
- optional image URL

Create the quote.

### Step 3

Copy the helper command from the page, then run it from a payment-capable environment.

Typical env:

```bash
export X402_PAYER_PRIVATE_KEY="0xYOUR_FUNDED_PAYER_KEY"
export BASE_RPC_URL="https://mainnet.base.org"
```

Typical command:

```bash
npm run launch:agent -- --quote=<quote_id> --beneficiary=<beneficiary> --app-url=https://syntrophic.md
```

### Step 4

Show the returned proof bundle:

- `agent_id`
- `tx_hash`
- `bonded = true`
- `verification_url`
- `verification_line`

### Step 5

Verify one or more of these live:

- Syntrophic verification page
- BaseScan tx
- ERC-8004 metadata read

## Judge Script

“Here is the profile and quote. Here is the x402-funded helper launch. The agent is now registered, bonded, and publicly verifiable on Base.”

## Before / After

Before:
- no bonded ERC-8004 identity

After:
- Base ERC-8004 agent exists
- SRP bond exists
- `syntrophic.status = BONDED`
- public verification page exists

## Future Scope To Mention Briefly

- single-payment multi-chain launch bundles
- sponsored bonding for already-registered ERC-8004 agents

Do not spend more than one sentence on future scope during the live demo.
