#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$ROOT_DIR/protocol/.env" ]; then
  set -a
  source <(grep -E '^[A-Z0-9_]+=' "$ROOT_DIR/protocol/.env" 2>/dev/null || true)
  set +a
fi

RPC_URL="${BASE_RPC_URL:-https://mainnet.base.org}"
VAULT_ADDRESS="0xFdB160B2B2f2e6189895398563D907fD8239d4e3"
REGISTRY_ADDRESS="0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
V2_AGENT_ID="${VERIFY_AGENT_ID:-36105}"

run_cast() {
  if ! cast "$@"; then
    echo "Verification failed. If the public Base RPC is rate-limited, set BASE_RPC_URL in protocol/.env to a dedicated endpoint and retry." >&2
    exit 1
  fi
}

verify_bond() {
  run_cast call "$VAULT_ADDRESS" "BOND_AMOUNT()(uint256)" --rpc-url "$RPC_URL"
}

verify_agent() {
  run_cast call "$VAULT_ADDRESS" "isBonded(uint256)(bool)" "$V2_AGENT_ID" --rpc-url "$RPC_URL"
}

verify_status() {
  run_cast call "$REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$V2_AGENT_ID" "syntrophic.status" --rpc-url "$RPC_URL"
}

verify_score() {
  run_cast call "$REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$V2_AGENT_ID" "syntrophic.score" --rpc-url "$RPC_URL"
}

case "${1:-all}" in
  bond)
    verify_bond
    ;;
  agent)
    verify_agent
    ;;
  status)
    verify_status
    ;;
  score)
    verify_score
    ;;
  all)
    verify_bond
    sleep 1
    verify_agent
    sleep 1
    verify_status
    sleep 1
    verify_score
    ;;
  *)
    echo "Usage: $0 {bond|agent|status|score|all}" >&2
    exit 1
    ;;
esac
