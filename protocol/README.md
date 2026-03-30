# Syntrophic Bond Protocol (SBP)

Syntrophic Bond Protocol is a decentralized trust layer for ERC-8004 agents.
Agents post a performance bond on Base and can be slashed via Oasis ROFL-backed attestations when behavior drops below trust thresholds.

This repo contains a Foundry implementation of SBP contract primitives:
- Bonding with fixed hackathon bond amount (`0.00001 ETH`)
- Tiered challenge windows for unstake requests
- EIP-712 score/slash attestations signed by a ROFL signer
- Automatic slashing to a community rewards address
- 30-day cooldown after slash
- Atomic register+bond via `SyntrophicOnboarder` (Sprint 0)
- Strict bonding mode that reverts on metadata sync failure
- Metadata backfill via `syncBondMetadata`

## Contracts

- `src/SBPVault.sol`: Core vault — `bond`, `bondFor`, `bondStrict`, score updates, unstake, withdraw, slashing.
- `src/SyntrophicOnboarder.sol`: Factory for atomic ERC-8004 register + SBP bond in one transaction.
- `src/adapters/ERC8004RegistryAdapter.sol`: Writes `syntrophic.*` metadata to ERC-8004, includes `syncBondMetadata` backfill.
- `src/interfaces/ISBPRegistryAdapter.sol`: Adapter callback + `canWrite` interface.
- `src/interfaces/ISBPVault.sol`: Minimal vault view interface for cross-contract reads.
- `src/interfaces/IERC8004Registry.sol`: Typed ERC-8004 interface from the verified Base implementation ABI.

## Live Deployment (Base Mainnet)

| Contract | V2 Address | V1 Address (legacy) |
|----------|-----------|-------------------|
| Adapter | `0x2ADF396943421a70088d74A8281852344606D668` | `0x63DCE10906BB3D3C8280A3fa578594D261C4b804` |
| Vault | `0xFdB160B2B2f2e6189895398563D907fD8239d4e3` | `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248` |
| Onboarder | `0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4` | N/A |

## Test

```sh
forge test --offline
```

## Deploy

Set env vars (Base mainnet only, chainId `8453`):

```sh
export BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/<alchemy_key>
export PRIVATE_KEY=0x<mainnet_wallet_private_key>
export BASESCAN_API_KEY=<basescan_key>
export COMMUNITY_REWARDS_ADDRESS=0xAa18897bE77e1aD63DF8502cdebF819e69deB03d
export ROFL_SIGNER_ADDRESS=0xYourROFLSignerAddress
```

You can copy `.env.example` to `.env` and fill it locally.

Full stack deployment (adapter + vault + onboarder):

```sh
forge script script/DeployMainnetStackV2.s.sol:DeployMainnetStackV2 --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

V1 one-shot deployment (adapter + vault only):

```sh
forge script script/DeployMainnetStack.s.sol:DeployMainnetStack --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Manual fallback deploy order:

```sh
forge script script/DeployERC8004RegistryAdapter.s.sol:DeployERC8004RegistryAdapter --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

```sh
# Copy deployed adapter address into REGISTRY_ADAPTER_ADDRESS first
forge script script/DeploySBPVault.s.sol:DeploySBPVault --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

```sh
# Set adapter -> vault link once (adapter owner only)
export SBP_VAULT_ADDRESS=0xYourDeployedVault
export REGISTRY_ADAPTER_ADDRESS=0xYourDeployedAdapter
forge script script/SetAdapterVault.s.sol:SetAdapterVault --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Verify on BaseScan:

```sh
forge verify-contract --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY <DEPLOYED_VAULT_ADDRESS> src/SBPVault.sol:SBPVault
```

## Syntrophic Agent #224: Register + Fetch `agentId`

Register `Syntrophic Agent #224` on ERC-8004 and print the created `agentId`:

```sh
forge script script/RegisterAgentJaune.s.sol:RegisterAgentJaune --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Fetch latest registered `agentId` for wallet `0xAAc9...9FD0` from on-chain `Registered` events:

```sh
AGENT_OWNER_WALLET=0xAAc9d098D966b465B6Fde6d7EcD719f01Dcb9FD0 ./script/fetch_agent_id_by_owner.sh
```

This helper requires `cast` and `jq`.

Read a full ERC-8004 agent record + Syntrophic metadata by `agentId`:

```sh
AGENT_ID=<agent_id> forge script script/FetchAgentRecord.s.sol:FetchAgentRecord --rpc-url $BASE_RPC_URL
```

## Notes

- All broadcast/read scripts are guarded to Base mainnet (`chainId == 8453`).
- Current bond amount is intentionally low for hackathon usage.
- For production, increase bond size and make economic parameters governance-controlled.
- Registry integration is intentionally adapter-based to avoid hard coupling to a single ERC-8004 metadata ABI.
- For adapter metadata sync to work, the ERC-8004 agent owner must authorize the adapter (or otherwise grant write authorization) on the registry.
- Never commit `.env` or plaintext private keys/API keys to git.
