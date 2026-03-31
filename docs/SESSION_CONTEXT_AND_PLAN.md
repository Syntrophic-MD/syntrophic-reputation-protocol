# Syntrophic Reputation Protocol — Full Session Context & Implementation Plan

> **For any new agent session** picking up work on this project. This document captures everything needed to continue without loss of context.

> **Date:** 2026-03-31
> **Previous session:** Spanned ~2 days of active development (March 29-31, 2026)

---

## 1. What This Project Is

Syntrophic Reputation Protocol (SRP) extends ERC-8004 agent identity with an on-chain bonded trust layer and ROFL-validated attestations. Agents stake ETH to signal credibility from day zero, with portable `syntrophic.*` metadata any app can verify on-chain.

**One-liner:** Stake your reputation. Signal trust from day zero. Join a cooperative agent ecosystem.

**Chain**: Base mainnet (chain ID 8453)
**Protocol framework**: Foundry (Solidity)
**Frontend framework**: Next.js 15 + React 19 + Tailwind CSS
**Live explorer**: https://www.syntrophic.md
**Hackathon**: The Synthesis 2026 / PL_Genesis

---

## 2. Rename Status

The project was renamed from **"Syntrophic Bond Protocol"** to **"Syntrophic Reputation Protocol"** on 2026-03-31.

### What was renamed:
- `SBPVault.sol` → `SRPVault.sol` (contract name: `SRPVault`)
- `ISBPVault.sol` → `ISRPVault.sol` (interface: `ISRPVault`)
- `ISBPRegistryAdapter.sol` → `ISRPRegistryAdapter.sol` (interface: `ISRPRegistryAdapter`)
- `SBPVault.t.sol` → `SRPVault.t.sol`
- `DeploySBPVault.s.sol` → `DeploySRPVault.s.sol`
- `SBP_Base_Mainnet_Demo_Report.md` → `SRP_Base_Mainnet_Demo_Report.md`
- EIP-712 domain name: `SyntrophicBondProtocol` → `SyntrophicReputationProtocol`
- All text references across README.md, AGENTS.md, PL_GENESIS_SUBMISSION.md, SKILL.md

### What was NOT renamed:
- The abbreviation "SBP" is still used in some places as the protocol abbreviation (being migrated to "SRP")
- On-chain contracts are immutable — deployed contract bytecode still has old names
- The `package.json`, `scripts/setup.sh`, `scripts/validate-env.sh` (created by this session) still reference "Bond Protocol" and need updating

### What to watch for:
- Search for remaining "Bond Protocol" or "SBP" references and update to "Reputation Protocol" / "SRP"
- The `foundry.toml`, `protocol/.env`, `protocol/.env.example` may still have old references
- Any `operations/docs/` strategic docs may reference old names

---

## 3. What Is Already Built & Deployed

### Contracts on Base Mainnet

| Contract | V2 Address | V1 Address (legacy) | BaseScan |
|----------|-----------|-------------------|----------|
| ERC-8004 Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | same | [link](https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) |
| ERC8004RegistryAdapter | `0x2ADF396943421a70088d74A8281852344606D668` | `0x63DCE10906BB3D3C8280A3fa578594D261C4b804` | [V2](https://basescan.org/address/0x2ADF396943421a70088d74A8281852344606D668) |
| SRPVault | `0xFdB160B2B2f2e6189895398563D907fD8239d4e3` | `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248` | [V2](https://basescan.org/address/0xFdB160B2B2f2e6189895398563D907fD8239d4e3) |
| SyntrophicOnboarder | `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4` | N/A | [link](https://basescan.org/address/0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4) |

**IMPORTANT**: On-chain contracts are immutable. The deployed bytecode still references `SBPVault`, `SyntrophicBondProtocol` EIP-712 domain, etc. This is fine — callers interact via ABI, not name strings. The EIP-712 domain change means any NEW deployment would use `SyntrophicReputationProtocol` as domain name, but existing V2 contracts use the old domain.

### Bonded Agents

| Agent | Token ID | Owner Wallet | Private Key | Vault | Status |
|-------|----------|-------------|-------------|-------|--------|
| #222 | 32055 | `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D` | `0x7cbf7574...cf67f0` | V1 (legacy) | Bonded |
| #223 | 36105 | `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D` | `0x7cbf7574...cf67f0` | V2 | Bonded |
| #224 | 36107 | `0xAAc9d098D966b465B6Fde6d7EcD719f01Dcb9FD0` | see protocol/.env | V2 | Bonded |
| #225 | 36109 | `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D` | `0x7cbf7574...cf67f0` | V2 | Bonded |
| #226 | 36111 | `0x24eF6f8233B1701FD0A55Dd1522483d0118239C4` | `0xf65e96e4...c46c33c` | V2 | Bonded |
| #227 | 36112 | `0xB0A9A824031A436ce9F60C4cdCb5eE893c4bdEc6` | `0x2e242d14...accdad` | V2 | Bonded |

**Full private keys are in `protocol/.env`** — never commit that file.

### Key wallet addresses
- **Deployer**: `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D` (private key: `0x7cbf7574036505f0e8f413284480d2f740a04ee46b03378e58ea51156dcf67f0`)
- **Community Rewards**: `0xAa18897bE77e1aD63DF8502cdebF819e69deB03d` (receives slashed bonds)
- **ROFL Signer**: `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D` (same as deployer — known limitation)

### RPC
- **Base mainnet**: `https://base-mainnet.g.alchemy.com/v2/OsRF2y8q09ZuCZdRMwis4` (in protocol/.env)
- **Public fallback**: `https://mainnet.base.org`
- **BaseScan API key**: `NW4BXJB73YKRHUY7DRYBUSNBVIWFZUDH3X`

### Protocol Tests
- **32 tests, 0 failures** (`forge test --offline` in `protocol/`)
- Test files: `SRPVault.t.sol` (332 lines), `ERC8004RegistryAdapter.t.sol` (137 lines), `SyntrophicOnboarder.t.sol` (101 lines)

### Contract Features (Sprint 0 — COMPLETE)
- `bond(agentId)` — standard bonding (msg.sender = staker)
- `bondFor(agentId, beneficiary)` — factory pattern (staker = beneficiary, not msg.sender)
- `bondStrict(agentId)` — reverts if adapter can't write metadata (pre-check)
- `updateScore(attestation, sig)` — EIP-712 ROFL-signed score updates
- `requestUnstake(agentId)` — starts challenge window countdown
- `executeSlash(attestation, sig)` — full bond slash + 30-day cooldown
- `withdraw(agentId)` — after challenge window expires
- `syncBondMetadata(agentId)` — permissionless metadata backfill on adapter
- `SyntrophicOnboarder.onboard(uri)` — atomic register + bond in one tx

### Key Contract Parameters (immutable on deployed contracts)
- `BOND_AMOUNT = 0.00001 ETH` (10_000_000_000_000 wei)
- `MAX_SCORE = 100`
- `SLASH_THRESHOLD = 51` (slash if score < 51)
- `COOLDOWN_SECONDS = 30 days`
- `STANDARD_WINDOW_BLOCKS = 300` (~10 minutes on Base)
- `NEW_USER_WINDOW_BLOCKS = 1800` (~1 hour on Base)

### Challenge Window Logic
```
if (score > 80 && reviewCount > 10) → 0 blocks (instant unstake)
if (reviewCount < 3) → 1800 blocks (~1 hour)
else → 300 blocks (~10 minutes)
```

---

## 4. Repository Structure

```
syntrophic-reputation-protocol/
├── package.json              ← NEW (root npm scripts — needs rename update)
├── README.md                 ← NEEDS REWRITE (see plan section 8)
├── AGENTS.md                 ← Judge evaluation guide
├── CLAUDE.md                 ← Points to AGENTS.md
├── PL_GENESIS_SUBMISSION.md  ← Hackathon submission doc (18KB)
├── SKILL.md                  ← Agent onboarding skill instructions (10.7KB)
│
├── protocol/                 ← Foundry smart contracts
│   ├── foundry.toml          ← Config with Base RPC endpoints
│   ├── .env                  ← SECRETS — never commit (has private keys, API keys)
│   ├── .env.example          ← Template for deployment env vars
│   ├── src/
│   │   ├── SRPVault.sol                       (15KB — core vault with all bond lifecycle)
│   │   ├── SyntrophicOnboarder.sol            (1.8KB — atomic register+bond factory)
│   │   ├── adapters/
│   │   │   └── ERC8004RegistryAdapter.sol     (3KB — metadata bridge to ERC-8004)
│   │   ├── interfaces/
│   │   │   ├── ISRPVault.sol                  (minimal vault view interface)
│   │   │   ├── ISRPRegistryAdapter.sol        (adapter callback + canWrite)
│   │   │   └── IERC8004Registry.sol           (typed ERC-8004 interface)
│   │   └── mocks/
│   │       ├── MockERC8004Registry.sol        (test mock with transferFrom)
│   │       └── MockRegistryAdapter.sol        (test mock with canWrite)
│   ├── test/
│   │   ├── SRPVault.t.sol                     (332 lines — 18 tests)
│   │   ├── ERC8004RegistryAdapter.t.sol       (137 lines — 8 tests)
│   │   └── SyntrophicOnboarder.t.sol          (101 lines — 6 tests)
│   ├── script/
│   │   ├── DeployMainnetStackV2.s.sol         (latest — deploys adapter+vault+onboarder)
│   │   ├── DeployMainnetStack.s.sol           (V1 — adapter+vault only)
│   │   ├── DeployERC8004RegistryAdapter.s.sol (standalone adapter deploy)
│   │   ├── DeploySRPVault.s.sol               (standalone vault deploy)
│   │   ├── DeploySyntrophicOnboarder.s.sol    (standalone onboarder deploy)
│   │   ├── FetchAgentRecord.s.sol             (read agent data from chain)
│   │   ├── RegisterAgentJaune.s.sol           (register test agent)
│   │   ├── SetAdapterVault.s.sol              (wire adapter→vault one-time)
│   │   └── fetch_agent_id_by_owner.sh         (bash helper)
│   ├── lib/                                   (forge-std, openzeppelin-contracts)
│   ├── out/                                   (compiled artifacts)
│   ├── cache/
│   └── broadcast/                             (deployment tx records)
│
├── frontend/                 ← Next.js 15 explorer
│   ├── package.json          ← Next.js 15.2, React 19, Tailwind, Framer Motion, SWR
│   ├── .env                  ← Frontend env (not secrets)
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── app/
│   │   ├── layout.tsx                        (root layout)
│   │   ├── page.tsx                          (34KB — main explorer landing page)
│   │   ├── globals.css
│   │   ├── agents/[...slug]/page.tsx         (agent detail view)
│   │   ├── explore/page.tsx                  (advanced browsing)
│   │   ├── contracts/page.tsx                (contract info page)
│   │   ├── erc-draft/page.tsx                (ERC spec viewer)
│   │   └── api/
│   │       ├── agents/route.ts               (proxy to 8004scan.io API)
│   │       └── agents/[agentId]/route.ts     (agent detail proxy)
│   ├── components/
│   │   ├── agent-search.tsx                  (search/filter widget)
│   │   ├── copy-button.tsx
│   │   ├── footer.tsx
│   │   ├── hero-buttons.tsx
│   │   ├── navbar.tsx
│   │   └── ui.tsx                            (GlassCard, StatCard, TrustBadge, AgentAvatar)
│   ├── lib/
│   │   ├── api.ts                            (8004scan.io API client, types, sanitization)
│   │   └── utils.ts
│   └── public/
│       └── skill.md
│
├── docs/
│   ├── ERC-Syntrophic-Draft.md               (14.5KB — full ERC spec draft)
│   ├── SRP_Base_Mainnet_Demo_Report.md       (7KB — deployment proof with tx hashes)
│   ├── cover.png                             (4.7MB social media art)
│   ├── demo-video.mp4                        (3.4MB)
│   ├── screenshot1.png, screenshot2.png
│
├── operations/
│   ├── README.md
│   ├── .env.example
│   ├── .secrets/                             (git-ignored)
│   ├── docs/
│   │   ├── Syntrophic_Strategic_Roadmap.md   (24KB — master plan)
│   │   ├── Syntrophic_Onboarding_Strategy.md (15KB)
│   │   ├── Service_Architecture_Foundation.md
│   │   ├── Workflow_Operation_Catalog.md
│   │   ├── API_MCP_CLI_Contracts_Draft.md
│   │   ├── Agent0_SDK_Research.md
│   │   ├── Roadmap_and_Open_Gaps.md
│   │   ├── operations/
│   │   │   ├── RUNBOOK_ERC8004_BATCH.md
│   │   │   └── ERC8004_Frictionless_Onboarding_Strategy.md
│   │   ├── reports/
│   │   │   ├── SBP_Bonding_Metadata_Incident_2026-03-23.md
│   │   │   └── SBP_Internal_Engineering_PM_Remediation_2026-03-24.md
│   │   └── state/
│   │       └── SYNTHROPHIC_Agent_Tracker_2026-03-25.md
│   ├── profiles/
│   │   ├── metadata/                         (8 agent JSON profiles)
│   │   ├── images/                           (agent artwork PNGs)
│   │   ├── ipfs_manifest_*.json
│   │   ├── syntrophic_agents_222_227.json
│   │   └── final_agents_223_227_summary.csv
│   └── scripts/
│       ├── erc8004_batch_register.sh
│       ├── erc8004_fix_https_images.sh
│       ├── sbp_batch_bond.sh
│       ├── upload_profiles_to_pinata.sh
│       ├── generate_syntrophic_profile_assets.py
│       └── generate_syntrophic_profile_assets_v2.py
│
├── agent-logs/                               (autonomous execution artifacts)
│   ├── agent.json                            (4.4KB — agent manifest)
│   ├── agent_log.json                        (8.9KB — execution log)
│   ├── ACTIVITY_LOG.md                       (14.8KB — timeline of decisions)
│   ├── CONVERSATION_LOG.md                   (8.8KB — agent-human interactions)
│   └── TOOL_USAGE.md                         (9.7KB — tool call metrics)
│
└── scripts/
    ├── setup.sh              ← NEW (one-command setup — needs rename update)
    ├── validate-env.sh       ← NEW (environment validator — needs rename update)
    ├── check-image-dimensions.mjs
    └── check-image-dimensions.py
```

---

## 5. Completed Work (This Session)

### 5.1 Sprint 0 — FULLY COMPLETE ✅
All code written, tested (32 pass), deployed to Base mainnet, documented.

**New contracts:**
- `SyntrophicOnboarder.sol` — atomic register+bond factory
- `ISRPVault.sol` — minimal vault view interface for cross-contract reads

**Modified contracts:**
- `SRPVault.sol` — added `bondFor()`, `bondStrict()`, refactored `bond()` into internal `_bond(agentId, staker)`
- `ERC8004RegistryAdapter.sol` — added `syncBondMetadata(agentId)`, `canWrite(agentId)`
- `ISRPRegistryAdapter.sol` — added `canWrite()` to interface
- `IERC8004Registry.sol` — added `transferFrom()`
- Both mocks updated for new functions

**New tests (15 new, 32 total):**
- `testBondFor`, `testBondForRevertsZeroBeneficiary`, `testBondForRevertsWhenCallerIsNotOwner`, `testBondForBeneficiaryCanUnstakeAndWithdraw`
- `testBondStrict`, `testBondStrictRevertsWhenAdapterNotSet`, `testBondStrictRevertsWhenCannotWrite`
- `testSyncBondMetadata`, `testSyncBondMetadataRevertsWhenNotBonded`
- `testOnboardRegistersAndBonds`, `testOnboardRefundsExcess`, `testOnboardRevertsOnInsufficientValue`, `testOnboardedAgentCanUnstakeAndWithdraw`, `testOnboardRevertsOnZeroAddressVault`, `testOnboardRevertsOnZeroAddressRegistry`

**Deploy script:** `DeployMainnetStackV2.s.sol` — deploys adapter + vault + onboarder atomically

### 5.2 V2 Mainnet Deployment ✅
All three V2 contracts deployed and verified on BaseScan (see addresses in section 3).

### 5.3 Agent Migration V1 → V2 ✅
- Agents #223, #224, #225 migrated from V1 vault to V2 vault
- Full lifecycle each: `requestUnstake` → wait 1800 blocks (~1 hour) → `withdraw` → `bond` on V2 → `registry.approve(V2_adapter, agentId)` → `adapter.syncBondMetadata(agentId)`
- Agent #222 intentionally stays on V1 for legacy 8004scan.io / syntrophic.md website compatibility

### 5.4 Profile Image Fix ✅
- All 6 agents (#222-#227) had their tokenURIs updated on-chain
- Problem: 8004scan.io can't fetch `ipfs://` URLs
- Solution: Created new metadata JSON with `https://ipfs.io/ipfs/` image URLs, pinned to Pinata, called `setAgentURI(agentId, "ipfs://newCID")` on registry
- All 6 `setAgentURI` transactions confirmed on Base mainnet

### 5.5 New Infrastructure Files ✅ (need rename update)
- `package.json` (root) — 30+ unified npm scripts for build, test, deploy, verify
- `scripts/setup.sh` — one-command setup with `--demo` and `--start` flags
- `scripts/validate-env.sh` — pre-flight environment checker

---

## 6. Lessons Learned / Gotchas

### On-chain operations
1. **V2 adapter must be approved on ERC-8004 registry** for each agent before metadata sync works. The approve call: `registry.approve(V2_adapter_address, agentId)` from the agent owner wallet.
2. **Profile images must use HTTPS gateway URLs** (`https://ipfs.io/ipfs/...`) not `ipfs://` — 8004scan.io can't resolve IPFS natively.
3. **Agent wallets need ETH for gas.** When migrating agent #223 (36105), the wallet had insufficient gas — had to send 0.0001 ETH from the deployer wallet first.
4. **syncBondMetadata is permissionless** — anyone can call it. Used deployer wallet to call it for agents owned by other wallets.
5. **Challenge window for new users is 1800 blocks** (~1 hour on Base). Had to wait this duration during V1→V2 migration for each agent.

### Contract design
6. **bondFor() solves the factory staker problem.** Without it, `SyntrophicOnboarder` would be the staker (since it's msg.sender to the vault). `bondFor` lets the factory set the real user as staker.
7. **bondStrict() pre-checks adapter.canWrite()** before bonding. This prevents the silent metadata sync failure (SRP-01). Regular `bond()` still fails open for backward compatibility.
8. **EIP-712 domain is per-deployment.** The domain separator includes `verifyingContract` address, so each vault deployment has a unique domain. Score/slash attestations from one vault can't be replayed on another.

### Frontend
9. **Frontend proxies 8004scan.io API** through Next.js API routes to avoid CORS. The proxy is at `/api/agents` → `https://www.8004scan.io/api/v1/agents`.
10. **Agent search filters**: "Syntrophic" filter prepends "syntrophic" to search. "Bonded (Demo)" does the same. "Mainnet Only" filters by `is_testnet: false`.
11. **Stats on the landing page are hardcoded mock data** (12,847 bonded agents, etc.) — not real on-chain data.

---

## 7. Security Model & Attack Vectors

### Trust Architecture (Three Tiers)

1. **Economic Trust** — ETH performance bonds via SRPVault. Real money at risk = real accountability.
2. **Cryptographic Trust** — ROFL-backed EIP-712 attestations. Score/slash transitions require signatures from the configured `roflSigner`.
3. **Portable Trust** — ERC-8004 metadata bridge. `syntrophic.*` keys are written to the ERC-8004 registry, readable by any app on-chain.

### Attack Vectors Addressed

| # | Attack Vector | How It Works | Syntrophic Mitigation | Contract Reference |
|---|---|---|---|---|
| 1 | **Sybil Farming** | Attacker creates many cheap identities to build fake reputation clusters | Bond cost (0.00001 ETH per identity) makes each identity economically costly; slash destroys the full bond | `SRPVault._bond()` requires `msg.value == BOND_AMOUNT` |
| 2 | **Reputation Laundering** | Agent builds good reputation then turns malicious after gaining trust | ROFL score updates track behavior changes; score below `SLASH_THRESHOLD` (51) triggers full bond slash + 30-day cooldown preventing re-entry | `SRPVault.executeSlash()` + `COOLDOWN_SECONDS` |
| 3 | **Attestation Replay** | Reusing old score/slash attestation signatures to manipulate state | Scores use strictly increasing nonce (`NonceNotIncreasing`); slashes use nonce-consumption (`usedSlashNonce`); both have deadline expiry | `SRPVault.updateScore()` nonce check, `usedSlashNonce` mapping |
| 4 | **Trust Arbitrage** | Fragmenting reputation across platforms to hide bad behavior on one | Single on-chain source of truth via `syntrophic.*` metadata keys in ERC-8004 — every app reads the same bonded/slashed/withdrawn state | `ERC8004RegistryAdapter._sync()` writes 5 canonical keys |
| 5 | **Griefing Withdrawals** | Agent requests unstake to escape an incoming slash before it lands | Challenge window (300-1800 blocks depending on trust level) gives observers time to submit slash evidence before unlock | `SRPVault.requestUnstake()` + `_challengeWindowBlocks()` |
| 6 | **Identity Squatting** | Claiming ERC-8004 IDs and sitting on them without economic commitment | `bondStrict()` mode ensures metadata sync succeeds before bond is accepted; agent without bond has no `syntrophic.status` metadata | `SRPVault.bondStrict()` + `registryAdapter.canWrite()` |
| 7 | **Signer Compromise** | ROFL signer key leaked enables malicious score/slash attestations | Known limitation in current version; governance-controlled key rotation planned for Sprint 2 | `roflSigner` is immutable in constructor |
| 8 | **Signature Malleability** | Using malleable ECDSA signatures to bypass checks | Custom `_recover()` function checks `s` value against malleability threshold | `ECDSA_MALLEABILITY_THRESHOLD` constant |
| 9 | **Reentrancy** | Re-entering vault during ETH transfers (slash/withdraw) | Custom `nonReentrant` modifier with lock status | `_reentrancyStatus` state variable |
| 10 | **Cross-chain Domain Confusion** | Replaying EIP-712 signatures across chains | Domain separator includes `chainId` and `verifyingContract`; cached and recomputed if chain forks | `_domainSeparator()` with `CACHED_CHAIN_ID` check |

### Known Limitations (Honest)
1. **Single ROFL signer** — one EOA controls all score/slash attestations. If compromised, attacker can slash any bonded agent. Fix: multi-signer governance (Sprint 2).
2. **Bond amount is hackathon-tuned** — 0.00001 ETH is trivial. Production needs governance-controlled bond sizing.
3. **No auto-slash** — score below threshold doesn't automatically trigger slash; requires a separate attested transaction (SRP-03).
4. **Explorer uses demo heuristics** — bonded filtering on the frontend uses search text matching, not native indexing.
5. **Metadata sync is fail-open** — regular `bond()` continues even if adapter can't write metadata. Use `bondStrict()` for guaranteed sync.

---

## 8. NEXT STEPS — Implementation Plan

### 8.1 — Fix Rename in New Files (QUICK)
The 3 new infrastructure files still say "Bond Protocol":
- `/package.json` — update `name` field to `syntrophic-reputation-protocol` and `description`
- `/scripts/setup.sh` — update banner text
- `/scripts/validate-env.sh` — update header text

### 8.2 — Make Scripts Executable
```bash
chmod +x scripts/setup.sh scripts/validate-env.sh
```

### 8.3 — GitHub Actions CI
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  protocol-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { submodules: recursive }
      - uses: foundry-rs/foundry-toolchain@v1
      - run: cd protocol && forge build
      - run: cd protocol && forge test --offline -vvv

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run build
```

### 8.4 — README Rewrite
The current README is hackathon-submission-focused with track alignment boilerplate. It needs to be project-focused and demo-ready.

**Key changes:**

**A. Quick Start at top** (< 5 minutes for judges):
```bash
git clone ... && cd syntrophic-reputation-protocol
npm run setup:demo    # install + compile + test + demo env
npm run dev           # start explorer at localhost:3000
npm run verify:all    # check live contracts on Base
```

**B. Three-tier trust narrative** (see section 7 above).

**C. Attack Vectors section** — the table from section 7 above (key improvement judges will notice).

**D. Architecture diagram (ASCII):**
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Agent Owner │────▶│   SRPVault       │────▶│ ERC8004Registry │
│  bonds ETH   │     │  bond/slash/     │     │ Adapter writes  │
└─────────────┘     │  withdraw        │     │ syntrophic.*    │
                    └──────┬───────────┘     │ metadata keys   │
                           │                 └─────────────────┘
                    ┌──────▼───────────┐            │
                    │  ROFL Signer     │     ┌──────▼──────────┐
                    │  EIP-712 signed  │     │  Any App / UI   │
                    │  attestations    │     │  reads trust    │
                    └──────────────────┘     │  state on-chain │
                                            └─────────────────┘
```

**E. Clean contract table** with V2 addresses and BaseScan links.

**F. Move PL_Genesis track boilerplate** to `PL_GENESIS_SUBMISSION.md` only (already exists there).

**G. Update test count** to 32 (currently says 17).

**H. API / npm scripts reference table** showing all available commands.

### 8.5 — Threat Model Document
Create `docs/THREAT_MODEL.md` — expand the attack vector table from section 7 into a full standalone document with:
1. Trust model assumptions (ROFL signer, ERC-8004 ownership semantics)
2. All 10 attack vectors with detailed analysis and code references
3. Slash economics (full bond → communityRewards address)
4. Challenge window game theory (why 300 vs 1800 blocks)
5. Known limitations and planned mitigations
6. EIP-712 domain and type hashes (exact spec)

### 8.6 — Frontend `.env.example`
Create `frontend/.env.example`:
```env
# Syntrophic Reputation Protocol — Frontend Environment
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_SRP_VAULT_ADDRESS=0xFdB160B2B2f2e6189895398563D907fD8239d4e3
NEXT_PUBLIC_REGISTRY_ADAPTER_ADDRESS=0x2ADF396943421a70088d74A8281852344606D668
NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
NEXT_PUBLIC_SYNTROPHIC_ONBOARDER_ADDRESS=0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4
```

### 8.7 — Update `.gitignore`
Add these entries:
```
# Environment files with secrets
protocol/.env
frontend/.env.local
operations/.env
.env

# Build artifacts
protocol/out/
protocol/cache/
frontend/.next/
node_modules/
```

### 8.8 — Update AGENTS.md
- Update test count to 32
- Reference V2 contracts as primary
- Add Quick Start using npm scripts
- Update contract names to SRP

### 8.9 — Update docs/ERC-Syntrophic-Draft.md
- Add V2 contract references
- Add `bondFor`, `bondStrict`, `syncBondMetadata` to the spec
- Update reference implementation section with new file names
- Update EIP-712 domain name

---

## 9. Strategic Roadmap (from operations/docs/)

The full roadmap is in `operations/docs/Syntrophic_Strategic_Roadmap.md` (24KB). Key audit findings:

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| SRP-01 | High | Silent metadata sync failure | **FIXED** (bondStrict + syncBondMetadata) |
| SRP-02 | High | No metadata backfill path | **FIXED** (syncBondMetadata) |
| SRP-03 | High | Auto-slash path incomplete | Open |
| SRP-04 | Medium | Score attestation staleness | Open |
| SRP-05 | Medium | Single ROFL signer | Open |
| SRP-06 | Low | Bond amount not governance-controlled | Open |
| SRP-07 | Low | No batch operations | Open |
| SRP-08 | Info | No event indexer | Open |

### Future Sprints (from roadmap)
- **Sprint 1**: Onboarding MVP — IPFS relay, gas drip, web UI for register+bond, Agent0 SDK integration
- **Sprint 2**: Protocol hardening — fix SRP-03/04/05, multi-signer governance, Validation Registry integration
- **Sprint 3**: Network growth — x402 marketplace integration, insurance pool, incentive mechanics
- **Sprint 4**: Subgraph / native indexer for frontend (replace 8004scan.io dependency)

---

## 10. Frontend Details

### Data Flow
- Frontend fetches from `https://www.8004scan.io/api/v1/agents` via Next.js API route proxy (avoids CORS)
- Agent detail pages fetch directly from 8004scan.io (SSR, no CORS issue)
- Syntrophic metadata (`syntrophic.status`, etc.) is read from the `raw_metadata.onchain` array in agent detail responses
- Trust levels displayed: Elite (90-100), Trusted (75-89), Verified (50-74), Active (25-49), New (0-24)

### Key Files
- `frontend/lib/api.ts` — Full 8004scan.io API client with types, sanitization, chain mappings
- `frontend/app/page.tsx` — Main landing page (34KB, hardcoded mock stats)
- `frontend/components/ui.tsx` — Reusable: GlassCard, StatCard, TrustBadge, AgentAvatar
- `frontend/components/agent-search.tsx` — Search with filter pills (All, Syntrophic, Bonded Demo, Mainnet Only)

### Running
```bash
cd frontend && npm install && npm run dev
# Opens at http://localhost:3000
```

---

## 11. Verification Commands

```bash
# Run all protocol tests (should see: 32 passed, 0 failed)
npm test
# or: cd protocol && forge test --offline

# Verify live contracts on Base mainnet
npm run verify:all

# Individual checks
cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "BOND_AMOUNT()(uint256)" --rpc-url https://mainnet.base.org
# → 10000000000000

cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "isBonded(uint256)(bool)" 32055 --rpc-url https://mainnet.base.org
# → true

cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.status" --rpc-url https://mainnet.base.org
# → 0x424f4e444544 (decode: "BONDED")

cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.score" --rpc-url https://mainnet.base.org
# → 0x...64 (decode: 100)

# Start frontend
npm run dev
# → http://localhost:3000

# Full setup from scratch
npm run setup:demo
```

---

## 12. Git History

```
d4dd74e 🗄️ FILECOIN INTEGRATION: Penta-Track Strategy Complete
4b8c44f 🎯 JACKPOT: Quad Track Strategy - Perfect ERC-8004 Primary Fit
34debd7 🎯 Strategic Update: Triple Track Submission
b0ff6d0 🤖 PL_Genesis: Complete Agent Only track submission
993094c Sprint 0: Add SyntrophicOnboarder, bondFor, bondStrict, syncBondMetadata
cede3fc Add agent onboarding and testing scripts and documents
8ca1c05 Copy the syntrophic-explorer repo
```

**Uncommitted changes** (as of 2026-03-31):
- Rename SBP→SRP across all protocol and doc files
- 3 new untracked files: `package.json`, `scripts/setup.sh`, `scripts/validate-env.sh`

---

## 13. Important Operational Notes

1. **Never commit `protocol/.env`** — it contains private keys, API keys, and RPC URLs with keys
2. **Agent #222 stays on V1 vault** for legacy 8004scan.io / syntrophic.md compatibility
3. **V2 adapter must be approved** on ERC-8004 registry for each agent: `registry.approve(V2_adapter_address, agentId)` from agent owner wallet
4. **Profile images** must use HTTPS gateway URLs (`https://ipfs.io/ipfs/...`) not `ipfs://`
5. **ROFL signer = deployer wallet** — `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D` — this is a known single-point-of-failure
6. **Community rewards address**: `0xAa18897bE77e1aD63DF8502cdebF819e69deB03d`
7. **Pinata account** is used for IPFS pinning (JWT in operations/.secrets/)
8. **On-chain contracts are immutable** — deployed V2 contracts still have old `SBPVault` / `SyntrophicBondProtocol` strings in bytecode
9. **The frontend has NO tests** — no Jest, Vitest, or Playwright configured
10. **There is no CI/CD** — no GitHub Actions, no pre-commit hooks
