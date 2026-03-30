# Syntrophic Bond Protocol - Base Mainnet Demo Report

Date: March 22-23, 2026 (CDT/UTC)
Network: Base Mainnet (Chain ID 8453)
Agent ID: `32055`

## 1) What We Built and Deployed

We deployed and verified two contracts for Syntrophic bonding of ERC-8004 agents:

- `ERC8004RegistryAdapter` (writes `syntrophic.*` metadata to ERC-8004 registry)
  - Address: `0x63DCE10906BB3D3C8280A3fa578594D261C4b804`
  - BaseScan: https://basescan.org/address/0x63DCE10906BB3D3C8280A3fa578594D261C4b804

- `SBPVault` (bonding/staking logic)
  - Address: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`
  - BaseScan: https://basescan.org/address/0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248

Referenced ERC-8004 registry:
- `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- BaseScan (read proxy): https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432#readProxyContract

Bond amount configured in vault:
- `0.00001 ETH` (`10000000000000` wei)

## 2) Mainnet Transactions Executed

### Deployment and Wiring
- Adapter deploy: https://basescan.org/tx/0x9e994f987f4f1c5592b290ada2ed79698413f4a42851f3456ed1246f9ed2529f
- Vault deploy: https://basescan.org/tx/0x4de898a73c0539e1570ee7f36e94304498ffe0f68cdeb09002a8a5fc727d816b
- Adapter `setVault(...)`: https://basescan.org/tx/0x39ed6533cdcc7584816b99ab2919d647081cc014f7d820f11739c9af94a4b56d

### First Live Bond
- `bond(32055)` from agent owner wallet
- Tx: https://basescan.org/tx/0xbdde5bc2c76c40c70072ad36a3ee3d396910d34c25cd0873ef1e8880a2696e52

### Authorization + Metadata Backfill (to show in ERC-8004 metadata)
- Approval correction: https://basescan.org/tx/0x75d39d4b56ccefb13584d9ebad9ea848678e73660509251d89f067dd3b5809e0
- Operator approval: https://basescan.org/tx/0x4aa7426804fe5a6295a8bcf4a7aa3698ee18476cc93c8971275dd1ccef0cdd80

Backfill `syntrophic.*` keys:
- `syntrophic.validator`: https://basescan.org/tx/0xe4f22784bfbd098929dac8c9888fada538e9e7afe7baf5e54bf0c97a7cbfea20
- `syntrophic.status`: https://basescan.org/tx/0xf8fff1c192cc87b1785b2e4b1935b46fb56eaecc87817651d4c41414838edb0f
- `syntrophic.score`: https://basescan.org/tx/0x53745fdcf83761d1f777b89b188a2927e21d1874a64e7c3539e2982d7e250dd3
- `syntrophic.reviewCount`: https://basescan.org/tx/0x5ef05b344257b97bf78603fde1646933ef6c58d10886de6496c00cb5970ca565
- `syntrophic.updatedAt`: https://basescan.org/tx/0xcea137f6be4fa2984b9e1bc89d97f7df2f818764a4522070ec1109b26b343743

## 3) Current On-Chain State (Expected)

Vault:
- `isBonded(32055) = true`
- `getBondStatus(32055)` shows:
  - staker: `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D`
  - amount: `10000000000000`
  - score: `100`

ERC-8004 metadata:
- `syntrophic.status` = `0x424f4e444544` (`BONDED`)
- `syntrophic.score` = `100`
- `syntrophic.reviewCount` = `0`
- `syntrophic.updatedAt` = `1774233303` (`2026-03-23 02:35:03 UTC`)
- `syntrophic.validator` = `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`

## 4) How to Verify On-Chain (UI)

1. Open ERC-8004 registry read page:
   - https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432#readProxyContract
2. Run `getMetadata(uint256,string)` with `agentId=32055` and these keys:
   - `syntrophic.status`
   - `syntrophic.score`
   - `syntrophic.reviewCount`
   - `syntrophic.updatedAt`
   - `syntrophic.validator`
3. Optional vault checks:
   - https://basescan.org/address/0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248#readContract
   - call `isBonded(32055)` and `getBondStatus(32055)`

## 5) How to Verify On-Chain (CLI)

Use Base RPC:

```bash
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.status" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.score" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.reviewCount" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.updatedAt" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.validator" --rpc-url https://mainnet.base.org
```

Decode helpers:

```bash
cast --to-ascii 0x424f4e444544
cast --to-dec 0x0000000000000000000000000000000000000000000000000000000000000064
cast --to-dec 0x0000000000000000000000000000000000000000000000000000000069c0a6d7
cast parse-bytes32-address 0x000000000000000000000000b3e75c11957a23f9a8df2a2eb59513832c8d1248
```

## 6) Sprint 0 Deployment — V2 Stack (March 29, 2026)

Deployed three new contracts alongside the original stack. Agent #222 (token 32055) remains bonded on the V1 vault for legacy scanner/website compatibility.

### New Contracts

- `ERC8004RegistryAdapter` V2 (adds `syncBondMetadata()` for metadata backfill)
  - Address: `0x2ADF396943421a70088d74A8281852344606D668`
  - BaseScan: https://basescan.org/address/0x2ADF396943421a70088d74A8281852344606D668

- `SBPVault` V2 (adds `bondFor()`, `bondStrict()`)
  - Address: `0xFdB160B2B2f2e6189895398563D907fD8239d4e3`
  - BaseScan: https://basescan.org/address/0xFdB160B2B2f2e6189895398563D907fD8239d4e3

- `SyntrophicOnboarder` (atomic register+bond in one transaction)
  - Address: `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4`
  - BaseScan: https://basescan.org/address/0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4

### What Changed

| Feature | V1 | V2 |
|---------|----|----|
| `bond()` | Sets staker = msg.sender | Same (refactored to internal `_bond`) |
| `bondFor(agentId, beneficiary)` | N/A | Sets staker = beneficiary (enables factory pattern) |
| `bondStrict(agentId)` | N/A | Reverts if adapter can't write metadata |
| `syncBondMetadata(agentId)` | N/A | Public backfill: reads vault state, writes metadata |
| `SyntrophicOnboarder.onboard(uri)` | N/A | Atomic register + bond + transfer in one tx |

### Contract Address Summary

| Contract | V1 (legacy, agent #222) | V2 (new agents) |
|----------|------------------------|-----------------|
| Adapter | `0x63DCE10906BB3D3C8280A3fa578594D261C4b804` | `0x2ADF396943421a70088d74A8281852344606D668` |
| Vault | `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248` | `0xFdB160B2B2f2e6189895398563D907fD8239d4e3` |
| Onboarder | N/A | `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4` |

### V2 CLI Verification

```bash
# Check vault V2 functions
cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "BOND_AMOUNT()(uint256)" --rpc-url https://mainnet.base.org

# Onboard a new agent (register + bond atomically)
# cast send 0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4 "onboard(string)(uint256)" "ipfs://QmYourAgentURI" --value 0.00001ether --rpc-url https://mainnet.base.org --private-key $PRIVATE_KEY
```

## 7) Note on Agent Scanner UI

You may not immediately see `syntrophic.*` labels rendered in https://www.syntrophic.md/agents/base/32055 or in third-party UI pages (for example `https://www.8004scan.io/agents/base/32055`) due to indexer/UI parsing behavior. BaseScan read calls above are the source-of-truth for on-chain data.
