#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

ENV_FILE=".secrets/main.env"
COUNT=5
FUND_AMOUNT="0.000005ether"
REGISTER_MODE="empty"
URI_PREFIX="https://www.syntrophic.md/agents/base"
URI_FILE=""
GAS_PRICE_WEI=""
REGISTER_GAS_LIMIT="250000"
DRY_RUN=0

TRANSFER_TOPIC="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
ZERO_TOPIC="0x0000000000000000000000000000000000000000000000000000000000000000"

usage() {
  cat <<'EOF'
Usage:
  scripts/erc8004_batch_register.sh [options]

Options:
  -n, --count <N>             Number of wallets/registrations to create (default: 5)
      --fund-amount <AMOUNT>  Amount to fund each new wallet (default: 0.000005ether)
      --env-file <PATH>       Env file path (default: .secrets/main.env)
      --register-mode <MODE>  Registration mode: empty|uri|uri-via-set (default: empty)
      --uri-prefix <PREFIX>   Prefix used when --register-mode uri (default: https://www.syntrophic.md/agents/base)
      --uri-file <PATH>       Newline-delimited list of agent URIs used in order when --register-mode uri
      --gas-price-wei <WEI>   Explicit gas price (wei) for all txs; avoids wallet-side auto-estimation spikes
      --register-gas-limit <N> Gas limit used for register txs (default: 250000)
      --dry-run               Generate wallets + planned output files without broadcasting txs
  -h, --help                  Show this help

Examples:
  scripts/erc8004_batch_register.sh --count 5
  scripts/erc8004_batch_register.sh --count 10 --fund-amount 0.00001ether
  scripts/erc8004_batch_register.sh --register-mode uri --uri-prefix https://example.com/agents
  scripts/erc8004_batch_register.sh --count 5 --register-mode uri --uri-file profiles/metadata_uris.txt
  scripts/erc8004_batch_register.sh --count 5 --register-mode uri-via-set --uri-file profiles/metadata_uris.txt --gas-price-wei 10000000
  scripts/erc8004_batch_register.sh --count 5 --register-mode uri --uri-file profiles/metadata_uris.txt --gas-price-wei 6000000
EOF
}

log() {
  printf '[%s] %s\n' "$(date +'%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

normalize_tx_hash() {
  local raw
  raw="$(cat)"
  printf '%s' "$raw" | tr -d '\r' | tail -n1 | tr -d '[:space:]'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--count)
      COUNT="${2:-}"
      shift 2
      ;;
    --fund-amount)
      FUND_AMOUNT="${2:-}"
      shift 2
      ;;
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --register-mode)
      REGISTER_MODE="${2:-}"
      shift 2
      ;;
    --uri-prefix)
      URI_PREFIX="${2:-}"
      shift 2
      ;;
    --uri-file)
      URI_FILE="${2:-}"
      shift 2
      ;;
    --gas-price-wei)
      GAS_PRICE_WEI="${2:-}"
      shift 2
      ;;
    --register-gas-limit)
      REGISTER_GAS_LIMIT="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage
      die "Unknown argument: $1"
      ;;
  esac
done

[[ "$COUNT" =~ ^[1-9][0-9]*$ ]] || die "--count must be a positive integer"
[[ "$REGISTER_MODE" == "empty" || "$REGISTER_MODE" == "uri" || "$REGISTER_MODE" == "uri-via-set" ]] || die "--register-mode must be empty, uri, or uri-via-set"
[[ "$REGISTER_GAS_LIMIT" =~ ^[1-9][0-9]*$ ]] || die "--register-gas-limit must be a positive integer"
if [[ -n "$GAS_PRICE_WEI" && ! "$GAS_PRICE_WEI" =~ ^[0-9]+$ ]]; then
  die "--gas-price-wei must be an integer in wei"
fi
[[ -f "$ENV_FILE" ]] || die "Env file not found: $ENV_FILE"

require_cmd cast
require_cmd jq

set -a
source "$ENV_FILE"
set +a

for var in BASE_RPC_URL PRIVATE_KEY ERC8004_REGISTRY_ADDRESS; do
  [[ -n "${!var:-}" ]] || die "Required env var missing in ${ENV_FILE}: ${var}"
done

if [[ ("$REGISTER_MODE" == "uri" || "$REGISTER_MODE" == "uri-via-set") && -z "${URI_PREFIX}" ]]; then
  die "--uri-prefix must be non-empty when --register-mode uri or uri-via-set"
fi

if [[ -n "$URI_FILE" && "$REGISTER_MODE" != "uri" && "$REGISTER_MODE" != "uri-via-set" ]]; then
  die "--uri-file can only be used when --register-mode uri or uri-via-set"
fi

declare -a URI_LIST=()
if [[ -n "$URI_FILE" ]]; then
  [[ -f "$URI_FILE" ]] || die "URI file not found: $URI_FILE"
  while IFS= read -r line || [[ -n "$line" ]]; do
    trimmed="$(printf '%s' "$line" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
    [[ -z "$trimmed" ]] && continue
    URI_LIST+=("$trimmed")
  done < "$URI_FILE"

  if [[ "${#URI_LIST[@]}" -lt "$COUNT" ]]; then
    die "--uri-file has ${#URI_LIST[@]} URIs but --count requires ${COUNT}"
  fi
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BATCH_DIR=".secrets/wallet-batches/${TIMESTAMP}"
mkdir -p "$BATCH_DIR"

WALLETS_FILE="${BATCH_DIR}/wallets.json"
REPORT_FILE="${BATCH_DIR}/report.json"
PUBLIC_SUMMARY_FILE="${BATCH_DIR}/summary.csv"
SECRETS_ENV_FILE="${BATCH_DIR}/wallets.env"

log "Creating ${COUNT} owner wallets"
cast wallet new --number "$COUNT" --json > "$WALLETS_FILE"
chmod 600 "$WALLETS_FILE"

main_wallet="$(cast wallet address --private-key "$PRIVATE_KEY")"
if main_balance_wei="$(cast balance "$main_wallet" --rpc-url "$BASE_RPC_URL" 2>/dev/null)"; then
  log "Main wallet: ${main_wallet} (balance: ${main_balance_wei} wei)"
else
  log "Main wallet: ${main_wallet} (balance check skipped in this environment)"
fi
if [[ -n "$GAS_PRICE_WEI" ]]; then
  log "Using explicit gas price: ${GAS_PRICE_WEI} wei"
fi
log "Using register gas limit: ${REGISTER_GAS_LIMIT}"

echo '[]' > "$REPORT_FILE"
chmod 600 "$REPORT_FILE"
{
  printf '# Generated at %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  printf '# DO NOT COMMIT THIS FILE\n'
} > "$SECRETS_ENV_FILE"
chmod 600 "$SECRETS_ENV_FILE"

for i in $(seq 1 "$COUNT"); do
  idx=$((i - 1))
  wallet_entry="$(jq -c ".[$idx]" "$WALLETS_FILE")"
  address="$(jq -r '.address' <<<"$wallet_entry")"
  wallet_pk="$(jq -r '.private_key' <<<"$wallet_entry")"

  log "Processing wallet ${i}/${COUNT}: ${address}"

  fund_tx_hash=""
  register_tx_hash=""
  set_uri_tx_hash=""
  register_receipt_json='{}'
  agent_uri=""
  agent_id=""
  owner_onchain=""
  owner_verified=false

  if [[ "$DRY_RUN" -eq 0 ]]; then
    if [[ -n "$GAS_PRICE_WEI" ]]; then
      fund_tx_hash="$(
        cast send "$address" \
          --value "$FUND_AMOUNT" \
          --gas-price "$GAS_PRICE_WEI" \
          --gas-limit 21000 \
          --private-key "$PRIVATE_KEY" \
          --rpc-url "$BASE_RPC_URL" \
          --async | normalize_tx_hash
      )"
    else
      fund_tx_hash="$(
        cast send "$address" \
          --value "$FUND_AMOUNT" \
          --gas-limit 21000 \
          --private-key "$PRIVATE_KEY" \
          --rpc-url "$BASE_RPC_URL" \
          --async | normalize_tx_hash
      )"
    fi
    [[ "$fund_tx_hash" =~ ^0x[0-9a-fA-F]{64}$ ]] || die "Invalid fund tx hash for ${address}: ${fund_tx_hash}"
    cast receipt "$fund_tx_hash" --rpc-url "$BASE_RPC_URL" >/dev/null

    if [[ "$REGISTER_MODE" == "uri" ]]; then
      if [[ -n "$URI_FILE" ]]; then
        agent_uri="${URI_LIST[$idx]}"
      else
        agent_uri="${URI_PREFIX%/}/${address}"
      fi
      if [[ -n "$GAS_PRICE_WEI" ]]; then
        register_tx_hash="$(
          cast send "$ERC8004_REGISTRY_ADDRESS" \
            "register(string)" "$agent_uri" \
            --gas-price "$GAS_PRICE_WEI" \
            --gas-limit "$REGISTER_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      else
        register_tx_hash="$(
          cast send "$ERC8004_REGISTRY_ADDRESS" \
            "register(string)" "$agent_uri" \
            --gas-limit "$REGISTER_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      fi
    elif [[ "$REGISTER_MODE" == "uri-via-set" ]]; then
      if [[ -n "$URI_FILE" ]]; then
        agent_uri="${URI_LIST[$idx]}"
      else
        agent_uri="${URI_PREFIX%/}/${address}"
      fi

      wallet_nonce="$(cast nonce "$address" --rpc-url "$BASE_RPC_URL")"
      if [[ -n "$GAS_PRICE_WEI" ]]; then
        register_tx_hash="$(
          cast send "$ERC8004_REGISTRY_ADDRESS" \
            "register()" \
            --nonce "$wallet_nonce" \
            --gas-price "$GAS_PRICE_WEI" \
            --gas-limit "$REGISTER_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      else
        register_tx_hash="$(
          cast send "$ERC8004_REGISTRY_ADDRESS" \
            "register()" \
            --nonce "$wallet_nonce" \
            --gas-limit "$REGISTER_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      fi
    else
      if [[ -n "$GAS_PRICE_WEI" ]]; then
        register_tx_hash="$(
          cast send "$ERC8004_REGISTRY_ADDRESS" \
            "register()" \
            --gas-price "$GAS_PRICE_WEI" \
            --gas-limit "$REGISTER_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      else
        register_tx_hash="$(
          cast send "$ERC8004_REGISTRY_ADDRESS" \
            "register()" \
            --gas-limit "$REGISTER_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      fi
    fi

    [[ "$register_tx_hash" =~ ^0x[0-9a-fA-F]{64}$ ]] || die "Invalid register tx hash for ${address}: ${register_tx_hash}"
    register_receipt_json="$(cast receipt "$register_tx_hash" --rpc-url "$BASE_RPC_URL" --json)"

    agent_id_hex="$(jq -r --arg transfer "$TRANSFER_TOPIC" --arg zero "$ZERO_TOPIC" '
      [.logs[]?
       | select((.topics[0] | ascii_downcase) == ($transfer | ascii_downcase))
       | select((.topics[1] | ascii_downcase) == ($zero | ascii_downcase))
       | .topics[3]
      ][0] // empty
    ' <<<"$register_receipt_json")"

    if [[ -n "$agent_id_hex" ]]; then
      agent_id="$(cast to-dec "$agent_id_hex")"
      if [[ "$REGISTER_MODE" == "uri-via-set" ]]; then
        set_nonce="$((wallet_nonce + 1))"
        if [[ -n "$GAS_PRICE_WEI" ]]; then
          set_uri_tx_hash="$(
            cast send "$ERC8004_REGISTRY_ADDRESS" \
              "setAgentURI(uint256,string)" "$agent_id" "$agent_uri" \
              --nonce "$set_nonce" \
              --gas-price "$GAS_PRICE_WEI" \
              --gas-limit "$REGISTER_GAS_LIMIT" \
              --private-key "$wallet_pk" \
              --rpc-url "$BASE_RPC_URL" \
              --async | normalize_tx_hash
          )"
        else
          set_uri_tx_hash="$(
            cast send "$ERC8004_REGISTRY_ADDRESS" \
              "setAgentURI(uint256,string)" "$agent_id" "$agent_uri" \
              --nonce "$set_nonce" \
              --gas-limit "$REGISTER_GAS_LIMIT" \
              --private-key "$wallet_pk" \
              --rpc-url "$BASE_RPC_URL" \
              --async | normalize_tx_hash
          )"
        fi
        [[ "$set_uri_tx_hash" =~ ^0x[0-9a-fA-F]{64}$ ]] || die "Invalid set URI tx hash for ${address}: ${set_uri_tx_hash}"
        cast receipt "$set_uri_tx_hash" --rpc-url "$BASE_RPC_URL" >/dev/null
      fi

      owner_onchain="$(cast call "$ERC8004_REGISTRY_ADDRESS" "ownerOf(uint256)(address)" "$agent_id" --rpc-url "$BASE_RPC_URL")"
      if [[ "$(tr '[:upper:]' '[:lower:]' <<<"$owner_onchain")" == "$(tr '[:upper:]' '[:lower:]' <<<"$address")" ]]; then
        owner_verified=true
      fi
      log "Registered agentId=${agent_id} owner_verified=${owner_verified}"
    else
      log "Warning: could not extract agent ID from tx ${register_tx_hash}"
    fi
  fi

  batch_tag="$(tr -d '_' <<<"$TIMESTAMP")"
  printf 'BATCH_%s_WALLET_%02d_ADDRESS=%s\n' "$batch_tag" "$i" "$address" >> "$SECRETS_ENV_FILE"
  printf 'BATCH_%s_WALLET_%02d_PRIVATE_KEY=%s\n' "$batch_tag" "$i" "$wallet_pk" >> "$SECRETS_ENV_FILE"

  report_tmp="${REPORT_FILE}.tmp"
  jq \
    --argjson index "$i" \
    --arg address "$address" \
    --arg private_key "$wallet_pk" \
    --arg fund_amount "$FUND_AMOUNT" \
    --arg fund_tx "$fund_tx_hash" \
    --arg register_tx "$register_tx_hash" \
    --arg set_uri_tx "$set_uri_tx_hash" \
    --arg register_mode "$REGISTER_MODE" \
    --arg agent_uri "$agent_uri" \
    --arg agent_id "$agent_id" \
    --arg owner_onchain "$owner_onchain" \
    --argjson owner_verified "$owner_verified" \
    '. + [{
      index: $index,
      address: $address,
      private_key: $private_key,
      fund_amount: $fund_amount,
      fund_tx: (if $fund_tx == "" then null else $fund_tx end),
      register_tx: (if $register_tx == "" then null else $register_tx end),
      set_uri_tx: (if $set_uri_tx == "" then null else $set_uri_tx end),
      register_mode: $register_mode,
      agent_uri: (if $agent_uri == "" then null else $agent_uri end),
      agent_id: (if $agent_id == "" then null else $agent_id end),
      owner_onchain: (if $owner_onchain == "" then null else $owner_onchain end),
      owner_verified: $owner_verified
    }]' "$REPORT_FILE" > "$report_tmp"
  mv "$report_tmp" "$REPORT_FILE"
done

jq -r '
  ["index","address","agent_id","fund_tx","register_tx","owner_verified"],
  (.[] | [
    (.index | tostring),
    .address,
    ((.agent_id // "") | tostring),
    (.fund_tx // ""),
    (.register_tx // ""),
    (.owner_verified | tostring)
  ]) | @csv
' "$REPORT_FILE" > "$PUBLIC_SUMMARY_FILE"

log "Batch complete."
log "Sensitive wallets JSON: ${WALLETS_FILE}"
log "Sensitive wallets env:  ${SECRETS_ENV_FILE}"
log "Detailed report JSON:    ${REPORT_FILE}"
log "Public summary CSV:      ${PUBLIC_SUMMARY_FILE}"
