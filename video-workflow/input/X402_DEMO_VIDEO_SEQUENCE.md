# x402 Demo Video Sequence

Use this exact scene order for the recorded hackathon video.

## Required Flow

1. opening HTML slides
2. live website
3. terminal demo
4. return to website for proof
5. closing HTML slides

Do not skip that order.

## Scene 1: Opening HTML Slides

Goal:
- establish the big vision first
- frame Syntrophic as the decentralized verified badge for agents

Show slides that communicate:
- agents have a day-zero trust problem
- ERC-8004 gives identity, but mostly not day-zero trust
- Syntrophic makes onboarding the trust moment
- one x402 payment launches a bonded ERC-8004 identity

Suggested narration:
- "Syntrophic gives agents the decentralized equivalent of a verified badge."
- "We solve the day-zero trust problem, not only post-interaction reputation."

## Scene 2: Live Website

Open:
- `https://syntrophic.md`

Show:
- homepage hero
- the verification framing
- the instruction prompt to read `https://syntrophic.md/skill.md`

Then open:
- `https://syntrophic.md/skill.md`

What to emphasize:
- the skill tells an agent how to get verified
- the flow is sponsored
- the user does not need to manually acquire Base ETH

Suggested narration:
- "An agent can read this skill and follow the onboarding flow directly."
- "The flow creates a quote, pays through x402, and returns a verification link."

## Scene 3: Terminal Demo

Open terminal in:

```bash
cd /Users/agentbook/code/syntrophic-reputation-protocol/frontend
```

Run the environment setup:

```bash
export APP_URL="https://syntrophic.md"
export BASE_RPC_URL="https://mainnet.base.org"
export DEMO_PAYER_PRIVATE_KEY="0xYOUR_FUNDED_X402_PAYER_PRIVATE_KEY"
export DEMO_BENEFICIARY_ADDRESS="0xTHE_FINAL_OWNER_WALLET"
```

Then run:

```bash
node scripts/demo-paid-launch.mjs \
  --name="John Smith" \
  --description="An OpenClaw agent onboarding through Syntrophic for ERC-8004 identity and day-zero bonded trust." \
  --service="https://example.com/john-smith-agent" \
  --image="https://example.com/john-smith-agent.png"
```

What to capture on screen:
- quote creation
- x402 payment settlement
- launch result
- agent ID
- tx hash
- bonded state

Suggested narration:
- "This terminal acts as the agent client."
- "It creates the quote, pays once with x402 in USDC, and launches the sponsored onboarding flow."

## Scene 4: Return To Website For Proof

Go back to the site and show:

1. the returned `verification_url`
2. the agent verification page
3. the verification line
4. optionally the BaseScan transaction in a second tab

What to emphasize:
- the agent now has a public verification page
- the agent can reuse the verification line in socials, websites, and email signatures
- this is the decentralized verified badge moment

Suggested narration:
- "Now the agent has a public proof page and a reusable verification signature."
- "This is how trust becomes portable from day zero."

## Scene 5: Closing HTML Slides

Return to HTML slides for the close.

Closing messages:
- Syntrophic solves day-zero trust for agents
- one x402 payment launches a bonded ERC-8004 identity
- onboarding becomes the trust event
- future scope is multi-chain launch bundles and sponsored bonding for already-registered agents

Suggested last line:
- "Syntrophic turns onboarding into the moment an agent becomes verifiable."

## Recording Notes

- Keep the terminal segment short and focused.
- Do not linger on env vars longer than necessary.
- End on the verification page or final closing slide, not on the terminal.
- The strongest ending visual is:
  `John Smith • Syntrophic Verified Agent • https://syntrophic.md/agents/base/<agentId>`
