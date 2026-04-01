# Syntrophic Verified Badge Demo Operator Checklist

Goal:
- show the public onboarding prompt
- show the public skill
- create a quote on the x402 Demo page
- complete the paid launch from a helper runtime
- return a public verification page and signature line

## What This Demo Represents

The website prepares the onboarding.

The helper runtime completes the x402-funded sponsored launch.

Together they show how an agent becomes publicly verifiable on Base.

## Before You Start

Confirm these are ready:

- the frontend is live at `https://syntrophic.md`
- the x402 payer wallet is funded
- the beneficiary wallet is the wallet that should own the final ERC-8004 agent NFT
- the sponsor backend env is already configured on the live app

## Website Sequence

1. Open `https://syntrophic.md`
2. Click `Onboard Agent`
3. Show the copied prompt:
   `Use https://syntrophic.md/skill.md to get a Syntrophic verified badge.`
4. Open `https://syntrophic.md/skill.md`
5. Open `https://syntrophic.md/onboard`
6. Fill the form and create the quote
7. Copy the helper command from the page

## Terminal Setup

Open a terminal and run:

```bash
cd /Users/agentbook/code/syntrophic-reputation-protocol

export X402_PAYER_PRIVATE_KEY="0xYOUR_FUNDED_X402_PAYER_PRIVATE_KEY"
export BASE_RPC_URL="https://mainnet.base.org"
```

## Recommended Helper Command

Run the exact command copied from the page.

Typical form:

```bash
npm run launch:agent -- --quote=<quote_id> --beneficiary=<beneficiary_wallet> --app-url=https://syntrophic.md
```

## What To Say While It Runs

- "The website prepared the profile and quote."
- "This terminal acts as the x402-capable helper runtime."
- "Syntrophic sponsors the Base execution path, registers the ERC-8004 agent, posts the bond, and returns proof."

## What You Should See

The helper prints:

- `Quote: ...`
- `Payer: ...`
- `Agent ID: ...`
- `Tx Hash: ...`
- `Bonded: true`
- `Verification URL: ...`
- `Verification Line: ...`

## Immediately After Success

Open and show:

1. the returned `verification_url`
2. the BaseScan transaction using `tx_hash`
3. the returned `verification_line`

## Best Recording Sequence

1. Opening slides
2. Homepage prompt
3. Public skill
4. x402 Demo page quote creation
5. Terminal helper launch
6. Verification page
7. Closing slides

## If Something Fails

- quote validation error:
  fix the highlighted field on `/onboard`
- `402`:
  this is expected for plain browser launch attempts; use the helper runtime
- `410 QUOTE_EXPIRED`:
  generate a fresh quote
- `500`:
  sponsor backend, Pinata, or facilitator issue; retry once

## Fallback Demo If Live Payment Is Risky

If you do not want to risk a live payment path during a judged session:

1. pre-run the helper once before the presentation
2. keep the resulting verification page and tx hash ready
3. still show the homepage, skill, and x402 Demo page live
4. present the saved proof as the outcome of the same flow
