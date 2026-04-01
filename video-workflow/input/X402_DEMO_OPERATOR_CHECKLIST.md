# x402 Demo Operator Checklist

This is the simplest live operator flow for demonstrating Syntrophic from an agent perspective.

Goal:
- show an agent paying once with x402
- register a new ERC-8004 identity
- bond it on Base through Syntrophic
- return a public verification link and signature line

## What This Demo Represents

The terminal command acts as the agent client.

It does four things:
1. creates a sponsored onboarding quote
2. pays the x402 challenge in USDC
3. launches the Base onboarding flow
4. prints the proof bundle and verification output

## Before You Start

Confirm these are ready:

- the frontend is live at `https://syntrophic.md`
- the x402 payer wallet is funded with Base USDC
- the beneficiary wallet is the wallet that should own the final ERC-8004 agent NFT
- the sponsor backend env is already configured on the live app

## Terminal Setup

Open a terminal and run:

```bash
cd /Users/agentbook/code/syntrophic-reputation-protocol/frontend

export APP_URL="https://syntrophic.md"
export BASE_RPC_URL="https://mainnet.base.org"
export DEMO_PAYER_PRIVATE_KEY="0xYOUR_FUNDED_X402_PAYER_PRIVATE_KEY"
export DEMO_BENEFICIARY_ADDRESS="0xTHE_FINAL_OWNER_WALLET"
```

## Recommended Live Command

Run:

```bash
node scripts/demo-paid-launch.mjs \
  --name="John Smith" \
  --description="An OpenClaw agent onboarding through Syntrophic for ERC-8004 identity and day-zero bonded trust." \
  --service="https://example.com/john-smith-agent" \
  --image="https://example.com/john-smith-agent.png"
```

## What To Say While It Runs

- "This terminal is acting as the agent client."
- "The agent creates a quote, then pays once through x402 in USDC."
- "Syntrophic sponsors the Base execution path, registers the ERC-8004 agent, posts the bond, and returns proof."

## What You Should See

The script prints:

- `Quote: ...`
- `Beneficiary: ...`
- `Payment settlement: ...`
- `Launch result: ...`
- `Agent ID: ...`
- `Tx Hash: ...`
- `Bonded: true`

## Immediately After Success

Open and show:

1. the returned `verification_url`
2. the BaseScan transaction using `tx_hash`
3. the returned `verification_line`

Example ending line:

`John Smith • Syntrophic Verified Agent • https://syntrophic.md/agents/base/<agentId>`

## Best Recording Sequence

1. Show the homepage prompt:
   `Read https://syntrophic.md/skill.md and follow the sponsored onboarding instructions to get verified`
2. Show the skill page briefly.
3. Cut to terminal.
4. Run the command above.
5. Wait for proof output.
6. Open the returned verification page.
7. End on the verification line and explain that this is the decentralized verified badge for agents.

## If Something Fails

- `402`:
  the payer wallet or x402 payment path is not completing correctly
- `410 QUOTE_EXPIRED`:
  rerun the command without a preset quote
- `500`:
  sponsor backend or Pinata/live contract call failed, retry once

## Fallback Demo If Live Payment Is Risky

If you do not want to risk the live payment path during a judged demo:

1. pre-run the command once before the presentation
2. keep the terminal output ready
3. show the resulting `verification_url`, `tx_hash`, and `verification_line`
4. explain that the exact same command was used live before the session
