# Syntrophic Strategic Roadmap
## Protocol Hardening, Frictionless Onboarding, and Network Growth

**Date:** 2026-03-29
**Audience:** Protocol engineers, product team, ecosystem contributors
**Status:** Active — transfer to syntrophic-explorer repo when ready

---

## Part 1: Situation Assessment

### What Syntrophic has today

- **7 registered ERC-8004 agents** on Base mainnet (4 bonded, 3 pending)
- **SBP Vault** deployed and operational — bond, score, slash, withdraw lifecycle works
- **ERC-8004 Registry Adapter** — bridges vault state to `syntrophic.*` metadata keys
- **SKILL.md** — enables autonomous agents to bond/verify/unbond via cast commands
- **Operational scripts** — batch registration, bonding, IPFS upload, URI management
- **Trust model declaration** — all agents now declare `["reputation", "crypto-economic"]`

### What Syntrophic has wrong

Eight open findings from the live audit (SBP-01 through SBP-08), three of which are high severity:

| ID | Severity | Issue | Root cause |
|---|---|---|---|
| SBP-01 | **High** | Bond succeeds while metadata sync silently skips | Adapter fails open — no strict mode |
| SBP-02 | Medium | No backfill for already-bonded agents | Only lifecycle hooks write metadata |
| SBP-03 | **High** | Score below threshold doesn't auto-slash | Slash is a separate attested transaction |
| SBP-04 | **High** | Slash attestation not bound to canonical vault score | Stale attestation can slash current bond |
| SBP-05 | Medium | Single roflSigner EOA controls all slashes | No multisig or threshold signing |
| SBP-06 | Medium | ERC-8004 feedback doesn't update SBP score | Two separate systems, no bridge |
| SBP-07 | Low | Scripts lack preflight checks | No mandatory validation before writes |
| SBP-08 | Low | Vault truth vs metadata projection not separated | No divergence monitoring |

### What is missing for the network to grow

1. No way for an external agent to self-onboard without bash scripts and private key management
2. No web-based registration or bonding flow
3. SBP trust signal is invisible to standard ERC-8004 consumers (not in Validation Registry)
4. No revenue model — Syntrophic subsidizes all gas and IPFS costs
5. No viral mechanic — bonded agents don't naturally recruit other agents

---

## Part 2: Strategic Direction

### The thesis

Syntrophic's value is the **trust protocol**, not the onboarding tooling. The protocol makes agent trust portable, verifiable, and economically enforced. The onboarding experience is how the protocol reaches scale. Both must be excellent.

### Three strategic pillars

```
PILLAR 1: Protocol Integrity
  Fix the 8 SBP findings so the trust signal is reliable.
  Integrate with ERC-8004 Validation Registry so the signal is interoperable.

PILLAR 2: Frictionless Onboarding
  Deploy SyntrophicOnboarder.sol for atomic register+bond.
  Build web UI with Agent0 SDK for wallet-connected flows.
  Extend SKILL.md for autonomous agent self-registration.

PILLAR 3: Network Growth
  Make bonding a prerequisite for earning (x402 marketplace).
  Make bonded agents discoverable (explorer + search integration).
  Make the protocol composable (other apps consume SBP trust).
```

---

## Part 3: Prioritized Action List

### Sprint 0 — Foundations (1 week)

**Goal:** Unblock everything else. Ship the factory contract and fix the most dangerous protocol bug.

| # | Action | Type | Effort | Unblocks |
|---|---|---|---|---|
| 0.1 | **Deploy `SyntrophicOnboarder.sol`** — atomic register+bond in one transaction. User calls `onboard(agentURI)` with bond value. Register and bond either both succeed or both revert. Eliminates SBP-01 for new registrations permanently. | Contract | S | All onboarding flows |
| 0.2 | **Add `syncBondMetadata(agentId)` to adapter** — public idempotent function that reads current vault state and writes derived `syntrophic.*` metadata. Fixes SBP-02 for the 4 already-bonded agents. | Contract | S | Metadata consistency |
| 0.3 | **Add strict bond mode to SBPVault** — new `bondStrict(agentId)` that reverts if adapter metadata sync fails. Keep existing `bond()` as best-effort for backwards compatibility. Fixes SBP-01 for direct vault callers. | Contract | M | Protocol correctness |
| 0.4 | **Run `syncBondMetadata` for agents #222–#225** — backfill any metadata gaps from initial bonding. | Operations | Trivial | Clean state |

### Sprint 1 — Onboarding MVP (2 weeks)

**Goal:** External agents can register and bond from syntrophic.md with a browser wallet.

| # | Action | Type | Effort | Unblocks |
|---|---|---|---|---|
| 1.1 | **IPFS relay endpoint** — `POST /api/ipfs/pin` accepts agent card JSON, validates ERC-8004 schema (must include `crypto-economic` in `supportedTrust`), pins to Pinata, returns CID. Hides Pinata JWT from frontend. Rate limited per wallet address. | Backend | S | Web UI |
| 1.2 | **Gas drip endpoint** — `GET /api/drip/{address}` sends ~0.0002 ETH to addresses not yet registered on ERC-8004. One drip per address, ever. Simple DB record for dedup. | Backend | S | Zero-ETH onboarding |
| 1.3 | **Web UI — Flow A (new agent)** — React page at syntrophic.md/onboard using Agent0 SDK with `walletProvider`. Form collects name, description, service URLs. Connect wallet → upload IPFS → call `SyntrophicOnboarder.onboard()` → show success with explorer link. One MetaMask signature. | Frontend | M | External onboarding |
| 1.4 | **Web UI — Flow B (existing agent)** — React page at syntrophic.md/bond. Connect wallet → Agent0 `sdk.searchAgents({ owners: [wallet] })` → show user's agents → select one → call `bond(agentId)` → done. | Frontend | S | Existing agent bonding |
| 1.5 | **Extend SKILL.md with full onboarding** — Add "Task D: Register and Bond" template that covers wallet generation, IPFS upload via relay, gas drip, and `SyntrophicOnboarder.onboard()` call. Consent prompts at each irreversible step. | Docs | S | Autonomous agents |

### Sprint 2 — Protocol Hardening (2 weeks)

**Goal:** Fix the remaining high-severity findings and make SBP trust signal interoperable.

| # | Action | Type | Effort | Unblocks |
|---|---|---|---|---|
| 2.1 | **Bind slash attestation to canonical vault state (SBP-04)** — `executeSlash` must verify `attestation.score == bond.score` and `attestation.reviewCount == bond.reviewCount`. Reject stale or mismatched attestations. Add `stakeId` check already in spec. | Contract | M | Slash correctness |
| 2.2 | **Enforce slash finalization window (SBP-03)** — After `updateScore` drops score below `SLASH_THRESHOLD`, set a `slashDeadline`. If `executeSlash` is not called by deadline, allow anyone to call `finalizeSlash(agentId)` using the stored under-threshold state as proof. Prevents indefinite under-threshold bonds. | Contract | L | Automated enforcement |
| 2.3 | **Emit `validationResponse` to ERC-8004 Validation Registry** — On `onBond`, `onSlash`, and `onWithdraw`, the adapter additionally calls `validationRegistry.validationResponse(requestHash, score, "", 0x0, tag)`. Makes SBP trust readable via standard `getSummary(agentId, [vaultAddress], tag)`. | Contract | M | Ecosystem interoperability |
| 2.4 | **Preflight validation in all scripts (SBP-07)** — Add mandatory checks before any write: chain ID = 8453, owner match, adapter authorization status, current bond state, wallet balance sufficiency. Abort with actionable error if any check fails. | Scripts | S | Operational safety |
| 2.5 | **Publish feedback compatibility spec (SBP-06)** — Document the exact relationship: ERC-8004 `giveFeedback()` records raw reputation data; SBP `updateScore()` is a separate ROFL-attested flow that may consume feedback signals. Publish as a section in the ERC-Syntrophic-Draft. | Docs | S | Developer clarity |

### Sprint 3 — Sustainability and Growth (2 weeks)

**Goal:** Make the network self-sustaining and create viral growth mechanics.

| # | Action | Type | Effort | Unblocks |
|---|---|---|---|---|
| 3.1 | **x402 on IPFS relay** — Charge ~$0.01 USDC per IPFS pin via x402. Agents pay for their own metadata storage. Eliminates Syntrophic's Pinata cost. | Backend | S | Revenue |
| 3.2 | **x402 on gas drip** — Charge ~$0.05 USDC. Agent pays USDC, receives ETH. Eliminates Syntrophic's gas sponsorship cost. Self-sustaining onboarding. | Backend | S | Revenue |
| 3.3 | **Explorer bonded-agent filter** — On syntrophic.md explorer, add filter for `syntrophic.status = BONDED` and sort by score. Bonded agents are more discoverable than unbonded. This is the incentive to bond. | Frontend | M | Discovery value |
| 3.4 | **Agent0 search integration** — Register Syntrophic explorer as a data source for Agent0 semantic search. Agents searching `sdk.searchAgents({ supportedTrust: ['crypto-economic'] })` find Syntrophic-bonded agents. | Integration | M | Network effects |
| 3.5 | **x402 agent marketplace** — Bonded agents can list x402-gated services on syntrophic.md. Only `isBonded = true` agents can list. Creates the flywheel: bond to join → list services → earn via x402 → bond justifies itself. | Frontend + Backend | L | Business model |

### Sprint 4 — Protocol Maturity (3+ weeks)

**Goal:** Harden trust model for production scale.

| # | Action | Type | Effort | Unblocks |
|---|---|---|---|---|
| 4.1 | **Threshold signer for ROFL attestation (SBP-05)** — Replace single `roflSigner` EOA with multisig or threshold signing (Gnosis Safe, or custom 2-of-3). Add signer rotation via governance function with timelock. | Contract + Infra | L | Security |
| 4.2 | **Vault/metadata divergence monitoring (SBP-08)** — Background job polls `isBonded()` and `getMetadata("syntrophic.status")` for all agents. Alerts when they diverge for > 10 minutes. Dashboard shows real-time state comparison. | Infra | M | Observability |
| 4.3 | **ERC-8128 signed HTTP requests on endpoints** — Replace IP-based rate limiting on drip/IPFS endpoints with ERC-8128 signed requests. Agent proves it controls the address without accounts or API keys. | Backend | M | Sybil resistance |
| 4.4 | **Bond amount governance** — Current 0.00001 ETH is hackathon-calibrated. Add governance function to adjust `BOND_AMOUNT` (with timelock) based on network maturity and economic analysis. | Contract | S | Economic tuning |

---

## Part 4: Architecture Decisions

### Decision 1: Frontend signing, not backend custody

**Chosen:** Agent0 SDK with `walletProvider` in the browser. User's MetaMask/Coinbase Wallet signs all transactions. Syntrophic never holds private keys.

**Why:** Decentralized trust protocol cannot have a centralized signing backend. Users won't trust a service that holds their agent identity keys. Every DeFi protocol works this way. This is the only architecture consistent with Syntrophic's thesis.

**Trade-off:** Users must have a browser wallet. Mitigated by gas drip (no ETH needed upfront) and SKILL.md (autonomous agents can use `cast` directly).

### Decision 2: Atomic register+bond via factory contract

**Chosen:** `SyntrophicOnboarder.sol` calls `register(agentURI)` then `bond(agentId)` in one transaction.

**Why:** Eliminates the window between registration and bonding where SBP-01 (metadata sync failure) can occur. One MetaMask popup instead of two. Simplest possible UX.

**Trade-off:** Requires deploying a new contract. The factory must be approved/authorized by the registry and vault. Minimal risk since it's a thin wrapper.

### Decision 3: Keep `syntrophic.*` metadata keys AND add Validation Registry writes

**Chosen:** Dual-write. Adapter writes both `syntrophic.*` metadata keys (for direct fast lookup) and `validationResponse` to the Validation Registry (for standard ERC-8004 interoperability).

**Why:** The `syntrophic.*` keys are already deployed and consumed by the explorer and scripts. Removing them would break existing integrations. The Validation Registry adds interoperability — any app that queries ERC-8004's standard Validation Registry will find Syntrophic's trust signal without knowing Syntrophic's custom namespace.

**Trade-off:** Slightly more gas per lifecycle event (one extra `validationResponse` call). Worth it for ecosystem reach.

### Decision 4: SKILL.md as the autonomous agent interface

**Chosen:** A markdown instruction file that any LLM agent can load and follow. Uses `cast` for signing. No npm packages, no CLI installs, no trust in third-party code.

**Why:** AI agents running in Claude Code, OpenClaw, or any MCP-capable framework can load a markdown file and execute shell commands. This is the most universal interface — it works for any agent that can run bash. The SKILL is open source, auditable, and doesn't touch private keys.

**Trade-off:** Requires `cast` (Foundry) to be installed. This is reasonable for developer-operated agents. Non-technical users use the web UI instead.

### Decision 5: x402 for service fees, not for the bond itself

**Chosen:** x402 for IPFS relay and gas drip endpoints (charging USDC for operational costs). The SBP bond itself remains an ETH transaction signed by the agent's owner.

**Why:** The vault's `bond()` function requires `msg.value` in ETH. Converting x402 USDC to ETH would require a centralized swap service — adding custodial risk. Keeping the bond as a direct ETH transaction is cleaner. x402 fits naturally on the service endpoints where Syntrophic provides operational infrastructure.

**Trade-off:** Agents need some ETH (solved by gas drip). The drip itself can accept x402 USDC, so agents never need to acquire ETH manually.

---

## Part 5: Business Viability

### Revenue streams

| Source | When | Revenue per event | At 10K agents | At 1M agents |
|---|---|---|---|---|
| IPFS pinning (x402) | Sprint 3 | $0.01 | $100 | $10,000 |
| Gas drip markup (x402) | Sprint 3 | $0.02 | $200 | $20,000 |
| Marketplace commission (x402) | Sprint 3+ | 1-5% of tx | Variable | Significant |
| Premium explorer features | Sprint 4+ | $5-50/mo | Variable | Variable |
| Enterprise trust API | Future | Per-query | — | Significant |

At hackathon bond amounts ($0.025/agent), onboarding revenue is tiny. The real business is the **marketplace commission** — when bonded agents transact with each other via x402, Syntrophic takes a small cut as the trust layer that enabled the transaction.

### Cost structure

| Cost | Per agent | At 10K agents | At 1M agents |
|---|---|---|---|
| Gas drip (if subsidized) | ~$0.05 | $500 | $50,000 |
| IPFS storage | ~$0.001 | $10 | $1,000 |
| RPC/infra | Fixed | ~$100/mo | ~$1,000/mo |

With x402 on drip and IPFS endpoints, per-agent costs go to zero. Infrastructure costs scale logarithmically with caching and indexing.

### Moat analysis

| Component | Defensible? | Why |
|---|---|---|
| ERC-8004 registry | No | Public standard, anyone can register |
| SBP Vault contract | Somewhat | Open source, but first-mover + deployed + bonded agents create switching cost |
| ROFL attestation infrastructure | **Yes** | Proprietary scoring algorithm, off-chain compute, key management |
| Explorer + search | Somewhat | Network effects — agents and consumers go where the data is |
| Bonded agent network | **Yes** | Classic network effect — the more bonded agents, the more valuable being bonded |

The defensible moat is the **combination** of the ROFL attestation layer (hard to replicate) and the bonded agent network (network effect). The protocol itself is open — which is correct, because it builds trust in the system. The value accrues to the network operator (Syntrophic) through the scoring infrastructure and marketplace.

---

## Part 6: Community Value

### For agent developers

- **Day-zero trust:** New agents can signal credibility immediately via economic stake, without waiting for reputation to accumulate organically.
- **Portable identity:** `syntrophic.status = BONDED` is on-chain, readable by any app, not locked to one platform.
- **Discoverability:** Bonded agents appear in 8004scan, Agent0 search, and the Syntrophic explorer with higher trust signal.

### For agent consumers (humans and other agents)

- **Trust filtering:** Query `supportedTrust: ['crypto-economic']` to find agents that have something to lose if they misbehave.
- **Standard interface:** Use ERC-8004 Validation Registry's `getSummary()` to check trust — no Syntrophic-specific integration needed.
- **Accountability:** If an agent misbehaves, its bond can be slashed — economic consequence, not just a bad review.

### For the ERC-8004 ecosystem

- **Reference implementation** of crypto-economic trust on ERC-8004. SBP demonstrates how the `supportedTrust: ["crypto-economic"]` and Validation Registry are intended to be used.
- **Open standard draft** (ERC-Syntrophic) that other protocols can implement or extend.
- **Interoperability** — Syntrophic's trust signal is readable through standard interfaces, not a walled garden.

---

## Part 7: Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Low bond amounts don't deter sophisticated attackers | Medium | Governance-adjustable bond amount (Sprint 4.4). Start low to reduce onboarding friction, increase as network matures. |
| ROFL signer compromise | High | Threshold signing (Sprint 4.1). Timelock on signer changes. Emergency pause function. |
| ERC-8004 standard changes during Draft status | Medium | Abstract registry interactions behind interfaces. Monitor Ethereum Magicians discussion. Contribute to standard evolution. |
| Competing trust protocols | Low | First mover on ERC-8004 + open standard + network effects. Competition validates the market. |
| Gas price spikes on Base | Low | Base L2 gas is extremely cheap ($0.001-0.01 per tx). Even 100x spike is manageable. |
| Regulatory risk (agent identity, staking) | Medium | SBP is not a financial product — it's a performance bond. No yield, no trading. Legal review recommended before mainnet bond increase. |

---

## Part 8: Metrics That Matter

### Protocol health

- **Bonded agent count** — primary growth metric
- **Bond retention rate** — % of bonded agents that remain bonded after 30/90/180 days
- **Slash rate** — should be low (<1%) in healthy network, indicates enforcement works
- **Metadata sync rate** — % of bonded agents where vault state = metadata state (target: 100%)

### Onboarding funnel

- **Visitor → wallet connected** — measures interest
- **Wallet connected → registered** — measures friction
- **Registered → bonded** — measures commitment
- **Time to bonded** — target: under 2 minutes from first visit

### Network effects

- **Agent-to-agent trust checks** — how often bonded agents verify each other's status
- **x402 transaction volume** — marketplace activity between bonded agents
- **External consumers** — apps querying Syntrophic trust via Validation Registry

---

## Part 9: Implementation Dependencies

```
Sprint 0                Sprint 1                Sprint 2                Sprint 3
────────                ────────                ────────                ────────
0.1 Onboarder.sol ──────► 1.3 Web UI Flow A
                         1.4 Web UI Flow B
0.2 syncBondMetadata ───► 0.4 Backfill agents
0.3 Strict bond mode    ► 2.1 Slash binding
                         2.2 Slash finalization
                         2.3 Validation Registry ─► 3.4 Agent0 search
1.1 IPFS relay ─────────► 1.3 Web UI            ─► 3.1 x402 on IPFS
1.2 Gas drip ───────────► 1.3 Web UI            ─► 3.2 x402 on drip
1.5 SKILL.md v2                                  ─► (autonomous growth)
                         2.4 Preflight checks
                         2.5 Feedback spec       ─► 3.5 Marketplace
```

No circular dependencies. Each sprint is independently shippable. Sprint 0 is the critical path — everything else flows from the factory contract and backfill function.

---

## Appendix A: Contract Deployment Checklist

### SyntrophicOnboarder.sol

```
1. Deploy to Base mainnet:
   - Constructor args: ERC-8004 Registry address, SBP Vault address
   - Verify on BaseScan

2. Authorize the factory:
   - The factory calls register() which mints an NFT owned by msg.sender
   - The factory calls bond() which requires msg.sender == ownerOf(agentId)
   - Since register() is called inside the factory, the factory is msg.sender
   - IMPORTANT: The factory must transfer the NFT to the caller BEFORE bonding,
     OR the vault must accept bonds from the factory on behalf of the actual owner
   - Design choice: have register() mint to tx.origin or use a two-step where
     factory registers, transfers to msg.sender, then msg.sender bonds

3. Test on Base Sepolia first:
   - Deploy factory
   - Call onboard() with test metadata
   - Verify agentId minted to caller
   - Verify isBonded = true
   - Verify metadata synced
```

### Adapter syncBondMetadata

```
1. Add function to ERC8004RegistryAdapter:
   function syncBondMetadata(uint256 agentId) external {
       require(vault.isBonded(agentId), "not bonded");
       BondStatus memory status = vault.getBondStatus(agentId);
       _writeMetadata(agentId, status.score, status.reviewCount, status.bondedAt);
   }

2. Access control: callable by agent owner or permissionless (state is deterministic)
3. Deploy upgraded adapter or deploy alongside existing
4. Call for agents #222, #223, #224, #225
```

---

## Appendix B: Web UI Technical Stack

```
Frontend:
  - Next.js 14+ (App Router)
  - Agent0 SDK (agent0-sdk) for ERC-8004 operations
  - wagmi + viem for wallet connection UX
  - Tailwind CSS (matches existing explorer)

Backend (minimal):
  - Next.js API routes (or standalone Express)
  - POST /api/ipfs/pin — Pinata relay
  - GET /api/drip/{address} — gas faucet
  - SQLite or KV store for drip dedup

Deployment:
  - Vercel (existing syntrophic-explorer is Next.js)
  - Environment: PINATA_JWT, DRIP_WALLET_KEY, BASE_RPC_URL
```

---

## Appendix C: SyntrophicOnboarder.sol Reference

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IERC8004Registry {
    function register(string calldata agentURI) external returns (uint256);
    function ownerOf(uint256 agentId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface ISBPVault {
    function BOND_AMOUNT() external view returns (uint256);
    function bond(uint256 agentId) external payable;
}

contract SyntrophicOnboarder {
    IERC8004Registry public immutable registry;
    ISBPVault public immutable vault;

    event Onboarded(
        uint256 indexed agentId,
        address indexed owner,
        string agentURI,
        uint256 bondAmount
    );

    error WrongBondAmount(uint256 sent, uint256 required);

    constructor(address _registry, address _vault) {
        registry = IERC8004Registry(_registry);
        vault = ISBPVault(_vault);
    }

    /// @notice Register an ERC-8004 agent and bond with SBP atomically.
    /// @param agentURI IPFS URI to the agent's ERC-8004 registration file.
    /// @dev The caller must send exactly BOND_AMOUNT as msg.value.
    ///      The agent NFT is minted to this contract, bonded, then transferred
    ///      to msg.sender. This ensures the factory can call bond() as owner.
    function onboard(string calldata agentURI) external payable returns (uint256) {
        uint256 bondAmount = vault.BOND_AMOUNT();
        if (msg.value != bondAmount) revert WrongBondAmount(msg.value, bondAmount);

        // 1. Register — mints NFT to this contract (msg.sender = this contract)
        uint256 agentId = registry.register(agentURI);

        // 2. Bond — this contract is the owner, so bond succeeds
        vault.bond{value: bondAmount}(agentId);

        // 3. Transfer NFT to the actual caller
        registry.transferFrom(address(this), msg.sender, agentId);

        emit Onboarded(agentId, msg.sender, agentURI, bondAmount);
        return agentId;
    }
}
```

**Note:** This design mints to the contract first, bonds, then transfers. This ensures the factory can call `bond()` as the owner. After transfer, `msg.sender` owns the agent and is the staker. The vault's `staker` field records the address that called `bond()` (the factory), which may need adjustment in the vault to record the intended beneficiary. Alternative: use `register()` with a "mint to" parameter if the registry supports it. Test thoroughly on Sepolia before mainnet.
