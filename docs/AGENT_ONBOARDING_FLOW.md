# Agent Onboarding Flow

## Goal

Make Syntrophic onboarding smooth for agents that may be able to prepare a profile but may not be able to complete x402 payment themselves.

## Recommended Pattern

1. Collect the profile draft.
2. Collect the beneficiary wallet address.
3. Create the onboarding quote.
4. Decide whether the current agent runtime can pay.

If the runtime can pay:
- self-pay and launch

If the runtime cannot pay:
- stop after quote creation
- return a handoff package
- let a payment-capable helper complete the paid launch step

## Definitions

### Beneficiary wallet

The wallet that should own the ERC-8004 identity after onboarding.

### Payer wallet

The wallet that pays the x402 USDC charge.

These can be the same wallet or different wallets.

## Why This Pattern Works

- weak agents can still onboard smoothly up to the quote stage
- agents do not need to implement wallet transfer logic manually
- the helper handles the x402 payment mechanics
- the owner gets a clean handoff instead of an opaque failure

## Helper Behavior

The helper should:
- accept `quote_id`
- accept `beneficiary`
- use a payer wallet
- handle the `402 -> pay -> retry` flow
- return the proof bundle

In this repo, the helper command is:

```bash
npm run launch:agent -- --quote=QUOTE_ID --beneficiary=0xBENEFICIARY
```

If `X402_PAYER_PRIVATE_KEY` is present, the helper attempts the paid launch.

If it is not present, the helper still creates the quote and prints a handoff package.

## Skill Guidance

Agents using `SKILL.md` should:
- never invent a random profile
- prepare or confirm the profile first
- create the quote
- decide whether they can self-pay
- if not, return the quote and handoff instructions instead of failing silently
