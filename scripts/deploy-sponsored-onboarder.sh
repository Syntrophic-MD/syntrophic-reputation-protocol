#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/agent-onboarding-demo/.secrets/main.env"
BASE_RPC_URL=""
PRIVATE_KEY=""
CLI_BASE_RPC_URL=""
CLI_PRIVATE_KEY=""
SRP_VAULT_ADDRESS="0xFdB160B2B2f2e6189895398563D907fD8239d4e3"
ERC8004_REGISTRY_ADDRESS="0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"

usage() {
  cat <<'EOF'
Usage:
  scripts/deploy-sponsored-onboarder.sh [options]

Options:
  --env-file <path>             Env file to source for BASE_RPC_URL / PRIVATE_KEY
  --rpc-url <url>               Override Base RPC URL
  --private-key <hex>           Override deployer private key
  --vault-address <address>     SRPVault V2 address
  --registry-address <address>  ERC-8004 registry address
  -h, --help                    Show this help

Defaults:
  env file: agent-onboarding-demo/.secrets/main.env
  vault:    0xFdB160B2B2f2e6189895398563D907fD8239d4e3
  registry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --rpc-url)
      CLI_BASE_RPC_URL="$2"
      shift 2
      ;;
    --private-key)
      CLI_PRIVATE_KEY="$2"
      shift 2
      ;;
    --vault-address)
      SRP_VAULT_ADDRESS="$2"
      shift 2
      ;;
    --registry-address)
      ERC8004_REGISTRY_ADDRESS="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

BASE_RPC_URL="${CLI_BASE_RPC_URL:-${BASE_RPC_URL:-}}"
PRIVATE_KEY="${CLI_PRIVATE_KEY:-${SPONSORED_ONBOARDER_PRIVATE_KEY:-${PRIVATE_KEY:-}}}"

if [[ -z "${BASE_RPC_URL:-}" ]]; then
  echo "Missing BASE_RPC_URL. Pass --rpc-url or provide it in $ENV_FILE." >&2
  exit 1
fi

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Missing PRIVATE_KEY. Pass --private-key or provide it in $ENV_FILE." >&2
  exit 1
fi

DEPLOYER_ADDRESS="$(cast wallet address --private-key "$PRIVATE_KEY")"
DEPLOYER_CODE="$(cast code "$DEPLOYER_ADDRESS" --rpc-url "$BASE_RPC_URL")"

if [[ "$DEPLOYER_CODE" != "0x" ]]; then
  echo "Refusing to deploy with non-EOA wallet $DEPLOYER_ADDRESS." >&2
  echo "Detected onchain code/delegation at that address; use a plain EOA sponsor wallet." >&2
  exit 1
fi

echo "Deploying with plain EOA sponsor: $DEPLOYER_ADDRESS"

export BASE_RPC_URL PRIVATE_KEY SRP_VAULT_ADDRESS ERC8004_REGISTRY_ADDRESS

cd "$ROOT_DIR/protocol"
forge script script/DeploySyntrophicSponsoredOnboarder.s.sol:DeploySyntrophicSponsoredOnboarder \
  --rpc-url "$BASE_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
