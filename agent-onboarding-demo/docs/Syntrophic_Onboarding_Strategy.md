# Syntrophic Onboarding Strategy
## One-Click ERC-8004 Registration + SBP Bonding via syntrophic.md

**Date:** 2026-03-29
**Status:** Draft — for engineering and product alignment
**Context:** Based on research into Agent0 SDK, OpenServ SDK, ERC-8004 spec, ERC-8128, x402, and SBP architecture

---

## 1. The Goal

Allow any agent owner to arrive at syntrophic.md and become a **fully bonded Syntrophic agent** in two clicks — without managing IPFS, gas, private keys on a server, or understanding smart contract internals.

**Two entry points:**
- **New agent:** Register on ERC-8004 + bond with SBP → one flow
- **Existing ERC-8004 agent:** Skip registration, go straight to SBP bond → one flow

---

## 2. The Architecture Answer

> "Do we need them to connect with their wallet first, and then in the backend use the Agent0 SDK? Or is there a better way?"

**Use the wallet in the frontend, not the backend.**

Agent0 SDK's `walletProvider` parameter accepts any EIP-1193 provider (MetaMask, Coinbase Wallet, Rabby, etc.) directly in the browser. The user's wallet is the signer. Syntrophic's servers never see a private key. This is exactly how every DeFi protocol works — and it is the correct architecture for a decentralized trust network.

```
User's browser                    Syntrophic backend (minimal)
┌─────────────────────────────┐   ┌──────────────────────────┐
│  syntrophic.md/onboard      │   │                          │
│                             │   │  POST /api/ipfs/pin      │
│  Agent0 SDK (frontend)      │──▶│  (hides Pinata JWT)      │
│  + wagmi/viem               │   │  returns CID             │
│                             │   │                          │
│  MetaMask / Coinbase Wallet │   │  GET /api/drip/{address} │
│  (signs all transactions)   │   │  (sends gas ETH)         │
└─────────────────────────────┘   └──────────────────────────┘
         │
         ▼
    Base Mainnet
    ERC-8004 Registry
    SBP Vault
```

**What the backend does NOT do:**
- Hold or generate private keys
- Sign transactions on behalf of users
- Custody any agent identity

**What the backend does:**
- Relay IPFS uploads to Pinata (hides the JWT from the frontend)
- Optionally dispense a gas drip to new wallets (Sybil-resistant via ERC-8004 ownership check)
- Serve the static frontend

---

## 3. User Flows

### Flow A — New Agent (Register + Bond)

```
1. User arrives at syntrophic.md/onboard
2. Fills form:
   - Agent name
   - Description
   - Service URL (MCP/A2A endpoint — optional)
   - Image (optional upload or URL)
3. Clicks "Connect Wallet"
   → Agent0: discoverEip6963Providers() → MetaMask popup → connected
4. Clicks "Register & Bond as Syntrophic Agent"
   → Agent0: build RegistrationFile with supportedTrust: ['reputation', 'crypto-economic']
   → POST /api/ipfs/pin → CID returned
   → Agent0: agent.registerIPFS() → MetaMask sign → tx submitted
   → wait for agentId from Transfer event
   → SBP Vault: bond(agentId) with 0.00001 ETH → MetaMask sign → tx submitted
   → wait for isBonded = true
5. Success page:
   - Agent ID: 8453:36115
   - Bond status: BONDED
   - Links: syntrophic.md/agents/36115, 8004scan.io/agent/8453:36115
   - Download: agent-card.json
```

**User signs exactly two transactions** — register and bond. MetaMask shows both clearly. Syntrophic's backend never touches the signing key.

### Flow B — Existing ERC-8004 Agent (Bond Only)

```
1. User arrives at syntrophic.md/bond
2. Clicks "Connect Wallet"
   → Agent0: discoverEip6963Providers() → connected
3. Frontend queries:
   → Agent0: sdk.searchAgents({ owners: [walletAddress], chains: [8453] })
   → Shows list of user's existing agents with bond status
4. User selects an agent (or enters agentId manually)
5. Clicks "Bond with Syntrophic"
   → Preflight: Agent0 sdk.isAgentOwner(agentId, walletAddress) — must be true
   → Preflight: check isBonded(agentId) — must be false
   → SBP Vault: bond(agentId) with 0.00001 ETH → MetaMask sign
   → wait for isBonded = true
6. Success: agent is now a bonded Syntrophic agent
```

**User signs one transaction.** No re-registration needed.

### Flow C — Autonomous Agent (No Human)

For agents registering themselves programmatically (SKILL-based flow):

```typescript
// Agent generates its own wallet, runs this code
const sdk = new SDK({
  chainId: 8453,
  privateKey: agentPrivateKey,   // agent's own key, never shared
  ipfs: 'pinata',
  pinataJwt: PINATA_JWT,         // or use Syntrophic's IPFS relay
})

const agent = sdk.createAgent("Scout", "Monitors DeFi prices")
agent
  .setTrust(true, true)           // reputation + crypto-economic
  .setX402Support(true)
  .setActive(true)

const regTx = await agent.registerIPFS()
const { result } = await regTx.waitMined()
const agentId = result.agentId   // "8453:36115"

// Bond with SBP Vault (direct cast or viem call)
await sbpVault.bond(agentId, { value: BOND_AMOUNT })
```

This is the SKILL.md path — no UI, no human, fully autonomous.

---

## 4. What Syntrophic Builds

### 4.1 Frontend — syntrophic.md/onboard

**Stack:** React (or Next.js) + Agent0 SDK + wagmi (for wallet connection UX)

Key Agent0 SDK usage:
```typescript
import { SDK, discoverEip6963Providers, connectEip1193 } from 'agent0-sdk'

// On wallet connect button click:
const wallets = await discoverEip6963Providers({ timeoutMs: 250 })
const { account } = await connectEip1193(wallets[0].provider, { prompt: true })

// Initialize SDK with browser wallet
const sdk = new SDK({
  chainId: 8453,
  walletProvider: wallets[0].provider,
  // IPFS uploads go through our relay, not directly to Pinata
})

// On register + bond click:
const agent = sdk.createAgent(formData.name, formData.description)
agent.setTrust(true, true).setX402Support(true).setActive(true)
if (formData.mcpUrl) await agent.setMCP(formData.mcpUrl)

const ipfsCid = await uploadViaRelay(formData)   // POST /api/ipfs/pin
await agent.setAgentURI(`ipfs://${ipfsCid}`)     // not registered yet, just sets local URI

const regTx = await agent.registerIPFS()         // MetaMask popup #1
const { result } = await regTx.waitMined({ timeoutMs: 45000 })
const agentId = result.agentId

await bondWithSBP(agentId, wallets[0].provider)  // MetaMask popup #2
```

### 4.2 Backend — Two Minimal Endpoints

**`POST /api/ipfs/pin`**
- Accepts agent card JSON from frontend
- Validates schema (ERC-8004 compliant, supportedTrust includes crypto-economic)
- Pins to Pinata using server-side JWT
- Returns `{ cid }`
- Rate limited per wallet address: 5 registrations per day

**`GET /api/drip/{address}`** (optional, for gas sponsorship)
- Checks: `ownerOf(anyId) != address` (address not yet registered — on-chain read, free)
- Checks: address not previously dripped (simple DB record)
- Sends 0.0002 ETH to address (covers gas + bond)
- Returns `{ txHash }`
- **ERC-8128 auth (phase 2):** Request signed by `{address}` proves key ownership — Sybil-resistant without accounts

### 4.3 SyntrophicOnboarder.sol — Factory Contract

The most important infrastructure piece: an atomic register+bond contract that collapses two transactions into one, solving SBP-01 permanently.

```solidity
contract SyntrophicOnboarder {
    IERC8004Registry public immutable registry;
    ISBPVault public immutable vault;

    event Onboarded(
        uint256 indexed agentId,
        address indexed owner,
        string agentURI,
        uint256 bondAmount
    );

    constructor(address _registry, address _sbpVault) {
        registry = IERC8004Registry(_registry);
        vault = ISBPVault(_sbpVault);
    }

    /// @notice Register on ERC-8004 and bond with SBP in one atomic transaction.
    /// @param agentURI IPFS URI to the agent's registration file
    function onboard(string calldata agentURI) external payable {
        require(msg.value == vault.BOND_AMOUNT(), "wrong bond amount");

        // 1. Register — emits Transfer event, agentId is the new tokenId
        uint256 agentId = registry.register(agentURI);

        // 2. Immediately bond — atomic with registration
        vault.bond{value: msg.value}(agentId);

        emit Onboarded(agentId, msg.sender, agentURI, msg.value);
    }
}
```

**Why this matters:**
- Register and bond are atomic — SBP-01 cannot occur
- User signs ONE transaction instead of two
- agentId is deterministically the token minted in the same tx
- If bond fails, register reverts — no orphaned registrations

With this contract, Flow A becomes a single MetaMask confirmation.

---

## 5. Trust Model Fix — Immediate Action Required

All existing Syntrophic agent metadata files must be updated to declare `crypto-economic` trust:

```json
// CURRENT (wrong):
"supportedTrust": ["reputation"]

// CORRECT:
"supportedTrust": ["reputation", "crypto-economic"]
```

This requires:
1. Update each agent card JSON
2. Re-upload to IPFS (new CID)
3. Call `setAgentURI(agentId, newCID)` for each agent

**Impact:** Any ERC-8004-aware consumer (8004scan, Agent0 search, other agents using `sdk.searchAgents({ supportedTrust: ['crypto-economic'] })`) will immediately find Syntrophic agents as trust-anchored.

For new registrations, Agent0 SDK handles this automatically:
```typescript
agent.setTrust(true, true)  // reputation=true, cryptoEconomic=true
```

---

## 6. The SBP ↔ ERC-8004 Validation Registry Gap

**Current state:** SBP writes `syntrophic.*` metadata keys to the Identity Registry. This is a proprietary namespace — only consumers who know about Syntrophic will look there.

**Better state:** SBP Vault also writes to the ERC-8004 **Validation Registry** as a registered validator. This makes Syntrophic's trust signal readable through the standard interface:

```solidity
// Any app, no Syntrophic-specific knowledge needed:
validationRegistry.getSummary(agentId, [sbpVaultAddress], "bond")
// → { count: 1, averageResponse: 100 }   // bonded at max score

validationRegistry.getSummary(agentId, [sbpVaultAddress], "score")
// → { count: 3, averageResponse: 87 }    // current score
```

**Adapter change needed:** In `ERC8004RegistryAdapter.onBond()`, additionally call `validationRegistry.validationResponse(bondHash, 100, "", 0x0, "bond")`. Similarly for `onSlash()` and score updates.

This eliminates the custom namespace dependency and makes Syntrophic fully interoperable with the ERC-8004 ecosystem.

---

## 7. x402 — Where It Fits

x402 is not for paying the SBP bond directly (the vault requires ETH as `msg.value`). x402 fits in three places:

### 7.1 IPFS Relay Endpoint (Phase 2)

```
POST /api/ipfs/pin
← 402 Payment Required: $0.01 USDC (covers Pinata storage costs)
Agent pays via x402
← 200 OK: { cid }
```

Small cost, fully automated, no accounts needed. Agents that can pay x402 get IPFS pinning without needing a Pinata JWT.

### 7.2 Gas Drip (Phase 2)

```
GET /api/drip/{address}
← 402 Payment Required: $0.05 USDC (converts to ETH + sends)
Agent pays USDC via x402
← 200 OK: { txHash }  — ETH sent to address
```

Eliminates the need for Syntrophic to absorb drip costs. Agent pays in USDC, receives ETH. Self-sustaining.

### 7.3 Syntrophic Agent Services (Phase 3)

Bonded Syntrophic agents can expose their own x402-gated services. The Syntrophic explorer links to `x402support: true` agents, creating a marketplace where bonding is the prerequisite for monetization. Flywheel: bond to join → earn via x402 → bond justifies itself.

---

## 8. ERC-8128 — Where It Fits

ERC-8128 (signed HTTP requests with Ethereum) is not needed for MVP but adds elegant Sybil resistance to the gas drip endpoint in Phase 2:

```
GET /api/drip/0x4814d1...
Signature: keyid="eip8128:8453:0x4814d1...", signature="..."
```

The server verifies the request was signed by the private key controlling `0x4814d1`. This proves the requester owns the address without any account creation, API keys, or KYC. **One HTTP header, cryptographic proof.**

Current status: Draft ERP, `@slicekit/erc8128` SDK exists. Implement in Phase 2 when the drip endpoint needs Sybil resistance beyond the on-chain ownership check.

---

## 9. Agent0 SDK vs. Building from Scratch

Agent0 SDK replaces ~600 lines of custom code already in this repo (the bash scripts). Specifically:

| Current custom code | Agent0 SDK equivalent |
|---|---|
| `erc8004_batch_register.sh` (412 lines) | `agent.registerIPFS()` — 1 line |
| `upload_profiles_to_pinata.sh` (~150 lines) | Handled internally by SDK |
| `erc8004_fix_https_images.sh` (~80 lines) | `agent.setAgentURI(newCid)` — 1 line |
| IPFS CID resolution and fallback | SDK built-in gateway fallback chain |
| Agent ownership verification | `sdk.isAgentOwner(agentId, address)` — 1 line |
| `sbp_batch_bond.sh` — NOT replaced | No SBP support in Agent0 (yet) |

**What Agent0 does not cover:**
- SBP bond/unbond/slash — Syntrophic's protocol, not in Agent0
- The Syntrophic-specific `syntrophic.*` metadata keys
- The gas drip service

These are Syntrophic's proprietary additions — they are the moat. Everything else is commoditized and Agent0 handles it better than custom scripts.

---

## 10. Phase Roadmap

### Phase 1 — Foundation (2 sprints)

| Item | What | Why |
|---|---|---|
| `SyntrophicOnboarder.sol` | Factory contract: register+bond atomic | Solves SBP-01 permanently |
| Fix `supportedTrust` | Add `crypto-economic` to all 7 agents | Correctness, ecosystem visibility |
| IPFS relay endpoint | `POST /api/ipfs/pin` | Hides Pinata JWT, enables frontend SDK |
| Web UI — Flow B | Bond-only flow (existing agents) | Fastest path to live demo |

### Phase 2 — Full Onboarding UX (2 sprints)

| Item | What | Why |
|---|---|---|
| Web UI — Flow A | Register + bond for new agents | Full onboarding flow |
| Gas drip endpoint | `GET /api/drip/{address}` | Eliminates ETH acquisition barrier |
| Agent0 SDK integration | Replace bash scripts with SDK calls | Cleaner, maintainable, well-tested |
| SBP → Validation Registry | Emit `validationResponse` on bond/score events | ERC-8004 ecosystem interoperability |

### Phase 3 — Autonomous + Viral (ongoing)

| Item | What | Why |
|---|---|---|
| SKILL.md v2 | Full onboard flow (register+bond) not just bond | Agents can self-onboard |
| x402 on IPFS relay + drip | Self-sustaining micropayment model | Removes Syntrophic subsidy |
| ERC-8128 on drip endpoint | Cryptographic Sybil resistance | No accounts, no KYC |
| Explorer x402 marketplace | Bonded agents earn from their services | Flywheel: bond → earn → grow |

---

## 11. Decision Summary

| Question | Answer |
|---|---|
| Frontend or backend SDK? | **Frontend** — Agent0 SDK with `walletProvider` |
| Who signs transactions? | **User's wallet** (MetaMask etc.) — never Syntrophic's servers |
| How many transactions to onboard? | **One** with `SyntrophicOnboarder.sol`, two without |
| Is x402 for the bond itself? | **No** — vault requires ETH. x402 for IPFS and drip services |
| Is ERC-8128 needed for MVP? | **No** — Phase 2. Simple on-chain check is sufficient at launch |
| Replace existing bash scripts? | **Yes, gradually** — Agent0 SDK is more robust for registration ops |
| What is Syntrophic's moat? | **SBP protocol + ROFL attestation + factory contract + explorer** |
| Is this decentralized? | **Yes** — contracts are open, SDK is open, user holds keys |
