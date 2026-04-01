# Syntrophic Verified Badge Demo Video Sequence

Use this exact scene order for the recorded hackathon video.

## Required Flow

1. opening HTML slides
2. live website homepage
3. public skill page
4. x402 Demo page
5. terminal helper launch
6. return to website for proof
7. optional BaseScan
8. closing HTML slides

Do not skip that order.

## Scene 1: Opening HTML Slides

Goal:
- establish the big vision first
- frame Syntrophic as the decentralized verified badge for agents

Show slides that communicate:
- agents have a day-zero trust problem
- ERC-8004 gives identity but not instant credibility
- Syntrophic makes onboarding the trust moment

## Scene 2: Homepage

Open:
- `https://syntrophic.md`

Show:
- hero section
- `Onboard Agent`
- the prompt copy dialog

What to emphasize:
- the website gives agents a public onboarding prompt
- the invitation is simple and agent-first

## Scene 3: Public Skill

Open:
- `https://syntrophic.md/skill.md`

What to emphasize:
- the skill tells the agent how to get verified
- it gathers a real profile, creates a quote, and either self-pays or hands off

## Scene 4: x402 Demo Page

Open:
- `https://syntrophic.md/onboard`

Fill the form and create a quote.

What to emphasize:
- this is the operator-friendly demo surface
- the browser prepares the quote and next step
- the paid launch is completed by a helper runtime

## Scene 5: Terminal Helper Launch

Open terminal in:

```bash
cd /Users/agentbook/code/syntrophic-reputation-protocol
```

Set runtime env:

```bash
export X402_PAYER_PRIVATE_KEY="0xYOUR_FUNDED_X402_PAYER_PRIVATE_KEY"
export BASE_RPC_URL="https://mainnet.base.org"
```

Run the helper command copied from `/onboard`.

Typical form:

```bash
npm run launch:agent -- --quote=<quote_id> --beneficiary=<beneficiary_wallet> --app-url=https://syntrophic.md
```

What to capture:
- quote reference
- agent ID
- tx hash
- bonded state
- verification URL

## Scene 6: Return To Website For Proof

Go back to the site and show:

1. the returned `verification_url`
2. the agent verification page
3. the verification line

What to emphasize:
- the agent now has a public verification page
- this is the portable verified badge moment

## Scene 7: BaseScan

Optionally show the transaction in a second tab.

What to emphasize:
- the bond and identity are independently verifiable on-chain

## Scene 8: Closing Slides

Return to slides for the close.

Closing messages:
- Syntrophic solves day-zero trust for agents
- it turns ERC-8004 identity into bonded trust
- onboarding becomes the trust moment

Suggested last line:
- "Syntrophic gives agents the decentralized equivalent of a verified badge."
