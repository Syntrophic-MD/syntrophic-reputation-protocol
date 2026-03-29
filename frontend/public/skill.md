---
name: syntrophic
description: "Operational skill for ERC-8004 agents to bond, verify, and unbond with Syntrophic Bond Protocol (SBP) on Base mainnet."
version: "2.0.0"
author: "Syntrophic Agent #222 + Narek Kostanyan"
license: "MIT"
metadata:
  openclaw:
    emoji: "🧬"
    requires:
      tools: ["web-fetch", "exec", "read"]
    websites:
      - "https://www.syntrophic.md/"
      - "https://basescan.org/"
    contracts:
      base:
        chainId: 8453
        erc8004Registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
        sbpVault: "0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248"
        erc8004RegistryAdapter: "0x63DCE10906BB3D3C8280A3fa578594D261C4b804"
        bondAmountWei: "10000000000000"
        bondAmountEth: "0.00001"
    social:
      github: "https://github.com/Syntrophic-MD/"
      website: "https://www.syntrophic.md/"
  docs:
    mainnetReport: "https://github.com/Syntrophic-MD/syntrophic-explorer/blob/main/docs/SBP_Base_Mainnet_Demo_Report.md"
    ercDraft: "https://github.com/Syntrophic-MD/syntrophic-explorer/blob/main/docs/ERC-Syntrophic-Draft.md"
---

# Syntrophic Skill: Bond, Verify, Unbond

This skill is for autonomous agents that want to interact with Syntrophic Bond Protocol (SBP) on Base mainnet.

Primary goal:
- bind trust to your ERC-8004 identity with an on-chain bond
- verify your status and metadata
- safely exit through requestUnstake -> withdraw when needed

ROFL integration:
- SBP trust transitions are validated by a configured ROFL signer using EIP-712 attestations.
- As a normal agent, your direct actions are `bond`, `requestUnstake`, `withdraw`, and read-only verification.

## 1) Network and Contract Constants

- Network: Base Mainnet (`chainId=8453`)
- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- SBP Vault: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`
- ERC8004 Registry Adapter: `0x63DCE10906BB3D3C8280A3fa578594D261C4b804`

SBP parameters (live deployment):
- `BOND_AMOUNT = 0.00001 ETH` (`10000000000000` wei)
- `SLASH_THRESHOLD = 51`
- `COOLDOWN_SECONDS = 30 days`
- `STANDARD_WINDOW_BLOCKS = 300`
- `NEW_USER_WINDOW_BLOCKS = 1800`

## 2) Safety Rules for Agents

- Never print or expose private keys in logs.
- Refuse to sign on any chain other than Base mainnet (`8453`) unless user explicitly requests otherwise.
- Before any write tx, verify owner of `agentId` equals signer wallet.
- Use on-chain reads as source of truth; UI/indexers may lag.
- Do not attempt `updateScore` or `executeSlash` unless explicitly authorized; those are ROFL-signer/validator flows.

## 3) Required Environment

```bash
export BASE_RPC_URL=${BASE_RPC_URL:-https://mainnet.base.org}
export ERC8004_REGISTRY_ADDRESS=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
export SBP_VAULT_ADDRESS=0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248
export REGISTRY_ADAPTER_ADDRESS=0x63DCE10906BB3D3C8280A3fa578594D261C4b804

# Required for write transactions:
export PRIVATE_KEY=0x...

# Known agent id for the wallet:
export AGENT_ID=12345
```

Optional helper:
```bash
AGENT_WALLET=$(cast wallet address --private-key "$PRIVATE_KEY")
echo "$AGENT_WALLET"
```

## 4) Preflight Checks (Always Run)

### 4.1 Chain check
```bash
cast chain-id --rpc-url "$BASE_RPC_URL"
# expected: 8453
```

### 4.2 Contract sanity checks
```bash
cast call "$SBP_VAULT_ADDRESS" "BOND_AMOUNT()(uint256)" --rpc-url "$BASE_RPC_URL"
cast call "$SBP_VAULT_ADDRESS" "SLASH_THRESHOLD()(uint8)" --rpc-url "$BASE_RPC_URL"
cast call "$SBP_VAULT_ADDRESS" "COOLDOWN_SECONDS()(uint256)" --rpc-url "$BASE_RPC_URL"
```

### 4.3 Ownership check
```bash
OWNER=$(cast call "$ERC8004_REGISTRY_ADDRESS" "ownerOf(uint256)(address)" "$AGENT_ID" --rpc-url "$BASE_RPC_URL")
ME=$(cast wallet address --private-key "$PRIVATE_KEY")
echo "owner=$OWNER"
echo "me=$ME"
# must match before bond/unbond writes
```

## 5) Task A: Bond Your Agent

Use this when `isBonded(agentId) == false`.

### 5.1 Check current status
```bash
cast call "$SBP_VAULT_ADDRESS" "isBonded(uint256)(bool)" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast call "$SBP_VAULT_ADDRESS" "cooldownUntil(uint256)(uint256)" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
```

### 5.2 Execute bond
```bash
cast send "$SBP_VAULT_ADDRESS" "bond(uint256)" "$AGENT_ID" \
  --value 0.00001ether \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$BASE_RPC_URL"
```

### 5.3 Verify post-state
```bash
cast call "$SBP_VAULT_ADDRESS" "isBonded(uint256)(bool)" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast call "$SBP_VAULT_ADDRESS" "getBondStatus(uint256)((bool,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256))" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
```

### 5.4 Verify ERC-8004 metadata bridge
```bash
cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$AGENT_ID" "syntrophic.status" --rpc-url "$BASE_RPC_URL"
cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$AGENT_ID" "syntrophic.score" --rpc-url "$BASE_RPC_URL"
cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$AGENT_ID" "syntrophic.reviewCount" --rpc-url "$BASE_RPC_URL"
cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$AGENT_ID" "syntrophic.updatedAt" --rpc-url "$BASE_RPC_URL"
cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$AGENT_ID" "syntrophic.validator" --rpc-url "$BASE_RPC_URL"
```

Decode helpers:
```bash
cast --to-ascii 0x424f4e444544    # BONDED
cast --to-dec 0x...               # score/reviewCount/updatedAt
cast parse-bytes32-address 0x...  # validator address
```

## 6) Task B: Verify Any Agent

Read-only trust check pipeline:

```bash
TARGET_AGENT_ID=32055

cast call "$SBP_VAULT_ADDRESS" "isBonded(uint256)(bool)" "$TARGET_AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast call "$SBP_VAULT_ADDRESS" "getBondStatus(uint256)((bool,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256))" "$TARGET_AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast call "$ERC8004_REGISTRY_ADDRESS" "ownerOf(uint256)(address)" "$TARGET_AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$TARGET_AGENT_ID" "syntrophic.status" --rpc-url "$BASE_RPC_URL"
```

Decision guidance:
- `isBonded=true` and `syntrophic.status=BONDED` => active bonded state
- `isBonded=false` and status `WITHDRAWN` => exited cleanly
- `isBonded=false` and status `SLASHED` => slashed and likely in cooldown

## 7) Task C: Unbond (Exit)

SBP unbond is a 2-step flow:
1. `requestUnstake(agentId)`
2. `withdraw(agentId)` after challenge window passes

### 7.1 Request unstake
```bash
cast send "$SBP_VAULT_ADDRESS" "requestUnstake(uint256)" "$AGENT_ID" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$BASE_RPC_URL"
```

### 7.2 Inspect unlock timing
```bash
cast call "$SBP_VAULT_ADDRESS" "challengeWindowBlocks(uint256)(uint256)" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast call "$SBP_VAULT_ADDRESS" "getBondStatus(uint256)((bool,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256))" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast block-number --rpc-url "$BASE_RPC_URL"
```

If `unlockBlock <= current block`, proceed to withdraw. Otherwise wait.

### 7.3 Withdraw
```bash
cast send "$SBP_VAULT_ADDRESS" "withdraw(uint256)" "$AGENT_ID" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$BASE_RPC_URL"
```

### 7.4 Verify exit
```bash
cast call "$SBP_VAULT_ADDRESS" "isBonded(uint256)(bool)" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$AGENT_ID" "syntrophic.status" --rpc-url "$BASE_RPC_URL"
# expected status bytes for WITHDRAWN: 0x57495448445241574e
```

## 8) Optional: Register an ERC-8004 Agent

If you do not yet have an `agentId`, you can register directly on ERC-8004 registry:

```bash
cast send "$ERC8004_REGISTRY_ADDRESS" "register()" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$BASE_RPC_URL"
```

Alternative with URI:
```bash
cast send "$ERC8004_REGISTRY_ADDRESS" "register(string)" "https://example.com/agent.json" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$BASE_RPC_URL"
```

After registration, resolve your new `agentId` from tx logs or explorer, then continue with bond flow.

## 9) Common Failure Modes

### `InvalidBondAmount`
Cause: wrong `--value`. Fix: use exactly `0.00001ether`.

### `NotAgentOwner`
Cause: signer wallet does not own `agentId`. Fix: switch wallet or use correct agent.

### `AlreadyBonded`
Cause: active bond exists. Fix: skip bond; just verify status.

### `InCooldown`
Cause: agent was slashed and cooldown not finished. Fix: wait until `cooldownUntil(agentId)`.

### `UnstakeNotRequested` or `ChallengeWindowActive`
Cause: withdraw called too early. Fix: run `requestUnstake`, then wait for unlock block.

### Metadata not updated after successful vault tx
Cause: adapter not authorized for that `agentId`. Fix: check registry authorization (`isAuthorizedOrOwner(adapter,agentId)`) and apply owner approval/authorization flow, then sync lifecycle via next state change.

## 10) Minimal Automation Templates

### Template: `bond_self`
1. chain check -> must be `8453`
2. owner check -> must match signer
3. if already bonded -> stop with success
4. call `bond(agentId)` with exact value
5. verify `isBonded=true` and metadata status `BONDED`

### Template: `unbond_self`
1. owner check
2. ensure currently bonded
3. call `requestUnstake(agentId)`
4. wait until unlock block
5. call `withdraw(agentId)`
6. verify `isBonded=false` and metadata status `WITHDRAWN`

### Template: `verify_agent`
1. read `isBonded`
2. read `getBondStatus`
3. read `syntrophic.status`, `syntrophic.score`, `syntrophic.updatedAt`
4. return normalized trust summary

## 11) Canonical Verification Links

- Syntrophic UI: https://www.syntrophic.md/
- Mainnet report: https://github.com/Syntrophic-MD/syntrophic-explorer/blob/main/docs/SBP_Base_Mainnet_Demo_Report.md
- ERC draft: https://github.com/Syntrophic-MD/syntrophic-explorer/blob/main/docs/ERC-Syntrophic-Draft.md
- BaseScan SBPVault: https://basescan.org/address/0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248
- BaseScan Registry Adapter: https://basescan.org/address/0x63DCE10906BB3D3C8280A3fa578594D261C4b804
- BaseScan ERC-8004 Registry: https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432

## 12) Final Notes for Autonomous Agents

- SBP is an accountability layer on top of ERC-8004 identity.
- Bonding is the core trust action you can perform autonomously.
- Score/slash changes are validator-attested flows; treat them as external signals.
- Prefer deterministic CLI reads/writes over scraped UI state.

Ready state for this skill:
- you can self-bond
- you can verify peers
- you can safely unbond when policy requires exit
