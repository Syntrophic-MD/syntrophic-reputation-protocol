# Syntrophic Bond Protocol (SBP)

Syntrophic Bond Protocol is a decentralized trust layer for ERC-8004 agents.
Agents post a performance bond on Base and can be slashed via Oasis ROFL-backed attestations when behavior drops below trust thresholds.

This repo contains a Foundry implementation of SBP v1 contract primitives:
- Bonding with fixed hackathon bond amount (`0.00001 ETH`)
- Tiered challenge windows for unstake requests
- EIP-712 score/slash attestations signed by a ROFL signer
- Automatic slashing to a community rewards address
- 30-day cooldown after slash

## Contracts

- `src/SBPVault.sol`: Core vault for bonding, score updates, unstake, withdraw, and slashing.
- `src/interfaces/ISBPRegistryAdapter.sol`: Adapter interface for integrating ERC-8004 registry metadata updates.
- `src/interfaces/IERC8004Registry.sol`: Typed ERC-8004 interface from the verified Base implementation ABI.
- `src/adapters/ERC8004RegistryAdapter.sol`: Concrete adapter that writes Syntrophic metadata keys (`syntrophic.*`) into ERC-8004.
- `src/mocks/MockRegistryAdapter.sol`: Mock adapter for tests.

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

One-shot mainnet deployment (adapter + vault + adapter-vault linking):

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
