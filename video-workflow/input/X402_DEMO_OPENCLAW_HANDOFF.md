# OpenClaw Handoff: Record the Syntrophic Verified Badge Demo

Use this file as the execution brief for an OpenClaw-generated demo video.

## Mission

Record a short live demo showing that Syntrophic gives agents a decentralized verified badge from day zero.

The practical flow to show is:
- an agent sees the onboarding prompt on the homepage
- it reads the public skill
- an operator creates the quote on the x402 Demo page
- a helper runtime completes the x402-funded launch
- the result is a public verification page and reusable verification line

## Key Message

Syntrophic is not only onboarding infrastructure.

It solves the day-zero trust problem for agents by turning ERC-8004 identity plus bonded trust into a portable verified badge.

The output is:
- a real agent identity
- a real economic commitment
- a public proof page anyone can verify

## Pages To Show

Required order:

1. opening HTML slides
2. `https://syntrophic.md`
3. `https://syntrophic.md/skill.md`
4. `https://syntrophic.md/onboard`
5. terminal running the helper launch command
6. returned verification page on `https://syntrophic.md/agents/base/<agentId>`
7. optional BaseScan transaction page
8. closing HTML slides

## Terminal Command To Record

Run from:

```bash
cd /Users/agentbook/code/syntrophic-reputation-protocol
```

Set env:

```bash
export X402_PAYER_PRIVATE_KEY="0xYOUR_FUNDED_X402_PAYER_PRIVATE_KEY"
export BASE_RPC_URL="https://mainnet.base.org"
```

Then execute the helper command copied from `/onboard`, or use this shape:

```bash
npm run launch:agent -- --quote=<quote_id> --beneficiary=<beneficiary_wallet> --app-url=https://syntrophic.md
```

## Narration Guidance

Use language close to this:

- "The homepage gives the agent its onboarding prompt."
- "The public skill explains how to gather the profile, create the quote, and complete or hand off the x402 flow."
- "The x402 Demo page prepares the quote and helper command."
- "The helper runtime completes the paid launch, and Syntrophic sponsors the Base execution path."
- "The result is a public verification page and a reusable verification line."

## The Final Shot Must Show

- `Bonded: true`
- the new `Agent ID`
- the `verification_url`
- the `verification_line`

## Example Final Line On Screen

`John Smith • Syntrophic Verified Agent • https://syntrophic.md/agents/base/<agentId>`

## Preferred Video Arc

1. Vision:
   Syntrophic is the decentralized verified badge for agents.
2. Problem:
   agents have no trust on day zero.
3. Flow:
   prompt → skill → quote → helper launch → proof.
4. Proof:
   show tx hash, agent ID, bonded state, and verification page.
5. Close:
   onboarding becomes the trust moment.
