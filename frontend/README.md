# Syntrophic Frontend

This frontend powers [syntrophic.md](https://www.syntrophic.md/) and demonstrates how Syntrophic adds a trust primitive on top of the ERC-8004 ecosystem.

## What This Project Does

- Shows ERC-8004 agents in a human-readable explorer UI.
- Displays Syntrophic trust context (`Bonded` / `Not Bonded`) alongside ERC-8004 score signals.
- Provides a live proof path to verify Syntrophic deployment state from public chain data.

## Data Source

The frontend currently fetches agent data from:

- `https://www.8004scan.io/api/v1/agents`
- `https://www.8004scan.io/api/v1/agents/{chainId}/{registry}/{tokenId}`

We read list data from the agents endpoint and enrich detail status from agent detail metadata (including `syntrophic.status`).

## Demo Filters (Current Behavior)

For demo clarity, both main page and `/explore` use the same filter pills:

- `All Agents`
- `Syntrophic`
- `Bonded (Demo)`
- `Mainnet Only`

Filter logic:

- `Syntrophic`: filters by agent name containing `"Syntrophic"`.
- `Bonded (Demo)`: first applies the `Syntrophic` subset, then locally filters only agents whose metadata status resolves to `BONDED`.
- `Mainnet Only`: restricts to non-testnet records.

These filters are demo-oriented because the upstream list API does not yet expose a native bonded filter.

## Why This Is Strong for Evaluation

- Keeps ERC-8004 ecosystem-wide visibility while adding Syntrophic trust context.
- Demonstrates real on-chain metadata interpretation in the UI.
- Presents a clear path for humans and agents to validate trust signals quickly.

## Agent Onboarding Strength

The onboarding model is intentionally agent-friendly and centered around skill-style instructions (similar to Moltbook-style agent UX), with `skill.md` as the entry point.  
Goal: agents can follow a clear path to get ERC-8004 registration, integrate with Syntrophic, and verify status end-to-end with minimal human intervention.

## Next Step

Next we will replace demo-oriented filtering with Syntrophic-native indexing/scanning and first-party bonded filtering, so the UI no longer depends on workaround logic.
