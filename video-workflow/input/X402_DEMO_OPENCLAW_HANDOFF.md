# OpenClaw Handoff: Record the x402 Verification Demo

Use this file as the execution brief for an OpenClaw-generated demo video.

## Mission

Record a short live demo showing that Syntrophic gives agents a decentralized verified badge from day zero.

The practical flow to show is:
- an agent reads the Syntrophic skill
- pays once with x402 in USDC
- gets registered on ERC-8004
- gets bonded on Base
- receives a public verification page and signature line

## Key Message

Syntrophic is not only onboarding infrastructure.

It solves the day-zero trust problem for agents.

Existing trust and validation systems are mostly post-interaction.
Syntrophic makes onboarding itself the trust event.

The output is the decentralized equivalent of a verified badge for agents.

## Pages To Show

Required order:

1. opening HTML slides
2. `https://syntrophic.md`
3. `https://syntrophic.md/skill.md`
4. terminal running the x402 demo script
5. returned verification page on `https://syntrophic.md/agents/base/<agentId>`
6. optional BaseScan transaction page
7. closing HTML slides

## Terminal Command To Record

Run from:

```bash
cd /Users/agentbook/code/syntrophic-reputation-protocol/frontend
```

Set env:

```bash
export APP_URL="https://syntrophic.md"
export BASE_RPC_URL="https://mainnet.base.org"
export DEMO_PAYER_PRIVATE_KEY="0xYOUR_FUNDED_X402_PAYER_PRIVATE_KEY"
export DEMO_BENEFICIARY_ADDRESS="0xTHE_FINAL_OWNER_WALLET"
```

Then execute:

```bash
node scripts/demo-paid-launch.mjs \
  --name="John Smith" \
  --description="An OpenClaw agent onboarding through Syntrophic for ERC-8004 identity and day-zero bonded trust." \
  --service="https://example.com/john-smith-agent" \
  --image="https://example.com/john-smith-agent.png"
```

## Narration Guidance

Use language close to this:

- "The agent reads Syntrophic's skill and follows the sponsored onboarding flow."
- "It creates a quote, pays once with x402 in USDC, and does not need to manually acquire Base ETH."
- "Syntrophic sponsors the onchain execution path, registers the ERC-8004 identity, and posts the bond."
- "The result is a public verification page and a reusable verification line the agent can place anywhere."

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
   one x402 payment launches a bonded ERC-8004 identity.
4. Proof:
   show tx hash, agent ID, bonded state, and verification page.
5. Close:
   onboarding becomes the trust moment.

## Required Editing Structure

- Start on HTML slides, not on the website.
- Move from slides into the live site.
- Move from the live site into the terminal.
- After terminal success, return to the site to show the verification result.
- Finish on HTML slides again for the final takeaway.
