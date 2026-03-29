#!/usr/bin/env bash
set -euo pipefail

: "${BASE_RPC_URL:?BASE_RPC_URL is required}"
if [[ -z "${AGENT_OWNER_WALLET:-}" && -n "${AGENT_224_WALLET:-}" ]]; then
  AGENT_OWNER_WALLET="$AGENT_224_WALLET"
fi
: "${AGENT_OWNER_WALLET:?AGENT_OWNER_WALLET (or AGENT_224_WALLET) is required}"

REGISTRY_ADDRESS="${ERC8004_REGISTRY_ADDRESS:-0x8004A169FB4a3325136EB29fA0ceB6D2e539a432}"
FROM_BLOCK="${FROM_BLOCK:-earliest}"

chain_id="$(cast chain-id --rpc-url "$BASE_RPC_URL")"
if [[ "$chain_id" != "8453" ]]; then
  echo "Wrong chain: expected 8453 (Base mainnet), got $chain_id"
  exit 1
fi

owner="${AGENT_OWNER_WALLET#0x}"
owner_topic="0x000000000000000000000000${owner,,}"
topic0="$(cast keccak "Registered(uint256,string,address)")"

logs_json="$(
  cast rpc \
    --rpc-url "$BASE_RPC_URL" \
    eth_getLogs \
    "[{\"address\":\"$REGISTRY_ADDRESS\",\"fromBlock\":\"$FROM_BLOCK\",\"toBlock\":\"latest\",\"topics\":[\"$topic0\",null,\"$owner_topic\"]}]"
)"

count="$(echo "$logs_json" | jq 'length')"
if [[ "$count" == "0" ]]; then
  echo "No Registered events found for wallet $AGENT_OWNER_WALLET"
  exit 1
fi

latest_topic1="$(echo "$logs_json" | jq -r '.[-1].topics[1]')"
latest_agent_id="$(cast --to-dec "$latest_topic1")"

echo "Registry: $REGISTRY_ADDRESS"
echo "Owner wallet: $AGENT_OWNER_WALLET"
echo "Registered events: $count"
echo "Latest agentId (decimal): $latest_agent_id"
echo "Latest agentId (topic hex): $latest_topic1"
