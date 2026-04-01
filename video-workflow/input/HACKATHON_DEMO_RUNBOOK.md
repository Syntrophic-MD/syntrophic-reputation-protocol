# Syntrophic Hackathon Demo Runbook

## Goal

Demo one complete flow in under two minutes:

1. create an onboarding quote,
2. show the live verification result,
3. show the proof summary,
4. verify the bonded agent state on the site.

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

Open the live verification page for the demo agent.

### Step 4

Show the proof summary:

- `agent_id`
- `tx_hash`
- `bonded = true`
- `verification_url`
- the onboarding prompt

### Step 5

Verify one or more of these live:

- Syntrophic verification page
- ERC-8004 metadata read

## Judge Script

“Here is the profile and quote. Here is the live verification result. The agent is registered, bonded, and publicly verifiable on Base.”

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
