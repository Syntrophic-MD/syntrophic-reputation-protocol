---
name: syntrophic
description: "Operational skill for agents that want to become Syntrophic Verified through sponsored ERC-8004 onboarding on Base."
version: "3.0.0"
author: "Syntrophic"
license: "MIT"
metadata:
  openclaw:
    emoji: "🧬"
    requires:
      tools: ["web-fetch", "read"]
    websites:
      - "https://syntrophic.md/"
      - "https://basescan.org/"
    contracts:
      base:
        chainId: 8453
        erc8004Registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
        srpVault: "0xFdB160B2B2f2e6189895398563D907fD8239d4e3"
        erc8004RegistryAdapter: "0x2ADF396943421a70088d74A8281852344606D668"
        sponsoredOnboarder: "0x7e29c63E8e30Fa104B448796dcb6f1355c3C0485"
        bondAmountWei: "10000000000000"
        bondAmountEth: "0.00001"
    social:
      github: "https://github.com/Syntrophic-MD/"
      website: "https://syntrophic.md/"
---

# Syntrophic Skill: Get Verified

Use this skill when you do not have an ERC-8004 identity yet and want to become a Syntrophic Verified agent on Base.

What this flow does:
- creates a sponsored onboarding quote
- pays once with x402 in USDC
- registers your ERC-8004 identity
- posts the Syntrophic bond on Base
- returns a verification link and signature line you can publish anywhere

Why this matters:
- ERC-8004 gives you portable agent identity
- Syntrophic gives you day-zero trust through bonded verification
- the result is the decentralized equivalent of a verified badge for agents

## 1) Base Mainnet Constants

- Network: Base Mainnet (`8453`)
- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- SRP Vault V2: `0xFdB160B2B2f2e6189895398563D907fD8239d4e3`
- ERC-8004 Adapter V2: `0x2ADF396943421a70088d74A8281852344606D668`
- Sponsored Onboarder: `0x7e29c63E8e30Fa104B448796dcb6f1355c3C0485`
- Bond amount: `0.00001 ETH`

## 2) Safety Rules

- Never expose private keys or seed phrases.
- Only use Base mainnet unless the user explicitly requests another chain in the future.
- Keep the beneficiary wallet user-controlled. The verified ERC-8004 identity should belong to the user, not to a temporary sponsor wallet.
- Treat the proof bundle and on-chain reads as the source of truth.
- Do not invent or fabricate the agent profile. Profile content should come from the owner, from the agent's established public identity, or from a draft the agent reasonably believes reflects the owner's intent.

## 3) Inputs You Need

Collect these values before starting:

- `beneficiary`: the wallet that should own the final ERC-8004 agent NFT
- `name`: public agent name
- `description`: short agent description
- `serviceUrl`: primary public URL for the agent
- `imageUrl`: optional HTTPS image URL

## 4) Profile Draft And Owner Confirmation

Before any quote creation or registration:

1. Gather the missing profile inputs from the owner, or draft them on the owner's behalf.
2. Show the full profile draft back to the owner:
   - beneficiary wallet
   - name
   - description
   - service URL
   - image URL
3. Decide whether owner confirmation is needed before proceeding.
4. If the owner is present, the profile is new or ambiguous, or the requested identity could surprise the owner, ask for explicit confirmation before registration.
5. If the agent is already trusted to manage its own identity and the profile clearly matches the owner's standing intent, it may continue autonomously.

If the owner declines or asks for changes:
- stop
- revise the profile draft
- do not register

This workflow is important because Syntrophic should verify a real intended identity, not generate a random one.

## 5) Step 1: Create the Sponsored Quote

Send a `POST` request to:

`https://syntrophic.md/api/onboarding/quotes`

If the site redirects, follow the final redirected host automatically instead of treating the redirect as a failure.

Body:

```json
{
  "params": {
    "beneficiary": "0xYOUR_BENEFICIARY_ADDRESS",
    "profile": {
      "name": "Your Agent Name",
      "description": "What your agent does and why it is useful.",
      "image_url": "https://example.com/agent.png",
      "services": [
        {
          "type": "mcp",
          "url": "https://example.com"
        }
      ]
    }
  },
  "context": {
    "chain_ids": [8453]
  }
}
```

Expected result:
- `quote_id`
- total USDC price
- line items for bond, gas, IPFS, and service fee

If the quote route returns a service-side error:
- preserve the confirmed profile draft
- report the exact error body to the owner
- do not invent fallback profile data
- retry later or switch to an operator-assisted/local fallback flow if available

## 6) Step 2: Pay and Launch Through x402

Send a paid `POST` request with x402 to:

`https://syntrophic.md/api/onboarding/launches/{quote_id}`

Body:

```json
{
  "params": {
    "beneficiary": "0xYOUR_BENEFICIARY_ADDRESS"
  },
  "context": {
    "chain_ids": [8453]
  }
}
```

Important:
- this route is x402-protected
- if you receive HTTP `402`, your client must complete the x402 payment challenge and retry
- after successful payment, Syntrophic sponsors the Base execution path
- if the x402 facilitator or payment layer fails, report that as a service/payment blocker instead of silently abandoning the onboarding attempt

## 7) Step 3: Read the Proof Bundle

Successful launch returns a proof bundle with:

- `agent_id`
- `tx_hash`
- `agent_uri`
- `bonded`
- `metadata_status`
- `verification_url`
- `verification_line`
- `badge_markdown`

The key success condition is:
- the agent is owned by the beneficiary wallet
- `bonded = true`
- `metadata_status = BONDED`

## 8) Step 4: Publish Your Verification

Use the returned verification data in social profiles, websites, and email signatures.

Example one-line signature:

`John Smith • Syntrophic Verified Agent • https://syntrophic.md/agents/base/38335`

Example markdown badge:

`[John Smith • Syntrophic Verified Agent](https://syntrophic.md/agents/base/38335)`

## 9) Verification Checks

To verify the final result:

- open the `verification_url`
- open the BaseScan transaction from `tx_hash`
- optionally confirm the metadata on Base:

```bash
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" AGENT_ID "syntrophic.status" --rpc-url https://mainnet.base.org
cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "isBonded(uint256)(bool)" AGENT_ID --rpc-url https://mainnet.base.org
```

## 10) Current Scope

Supported now:
- new-agent sponsored onboarding on Base
- x402 payment plus ERC-8004 registration plus Syntrophic bonding

Planned next:
- user-selected multi-chain launch bundles
- sponsored bonding for agents that are already registered on ERC-8004

## 11) Failure Handling

- `400 INVALID_INPUT`: profile or beneficiary input is malformed
- `402 PAYMENT_REQUIRED`: the x402 challenge must be completed
- `410 QUOTE_EXPIRED`: create a fresh quote
- `500+`: retry later or ask the user whether to try again
- HTTP redirect: follow it and continue on the final host
- quote route returns HTML or non-JSON: treat that as a service-side failure and surface the raw response to the owner
- quote or launch route returns a filesystem/runtime error: treat that as a Syntrophic service issue, preserve the confirmed draft, and retry later rather than changing the profile

If launch succeeds but metadata appears delayed:
- trust the proof bundle and transaction hash first
- refresh the agent page after indexing catches up
