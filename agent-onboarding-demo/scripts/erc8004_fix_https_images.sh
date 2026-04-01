#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

ENV_FILE=".secrets/main.env"
REGISTRY_ADDRESS=""
GATEWAY_BASE="https://ipfs.io/ipfs"
GAS_PRICE_WEI="5000000"
SET_URI_GAS_LIMIT="260000"
TOPUP_THRESHOLD_WEI="1500000000000"   # 0.0000015 ETH
TOPUP_AMOUNT="0.000005ether"
DRY_RUN=0
AGENT_IDS="32055,36105,36109,36110,36111,36112"
FINAL_KEYS_FILE=".secrets/wallet-batches/final_agents_223_227.json"

usage() {
  cat <<'EOF'
Usage:
  scripts/erc8004_fix_https_images.sh [options]

Options:
  --env-file <path>            Env file (default: .secrets/main.env)
  --registry <address>         ERC-8004 registry (default: ERC8004_REGISTRY_ADDRESS from env)
  --gateway-base <url>         HTTPS gateway base used for image fields (default: https://ipfs.io/ipfs)
  --agent-ids <csv>            Agent IDs to update (default: 32055,36105,36109,36110,36111,36112)
  --final-keys-file <path>     JSON file containing agent private keys for 223-227
  --gas-price-wei <wei>        Gas price for txs (default: 5000000)
  --set-uri-gas-limit <n>      Gas limit for setAgentURI (default: 260000)
  --topup-threshold-wei <wei>  Wallet balance floor before top-up (default: 1500000000000)
  --topup-amount <amount>      Top-up amount, cast format (default: 0.000005ether)
  --dry-run                    Prepare uploads/report without broadcasting txs
  -h, --help                   Show help
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

wait_for_balance_at_least() {
  local address="$1"
  local min_wei="$2"
  local attempts="${3:-20}"
  local sleep_sec="${4:-1}"
  local bal=""

  for _ in $(seq 1 "$attempts"); do
    bal="$(cast balance "$address" --rpc-url "$BASE_RPC_URL")"
    if [[ "$bal" -ge "$min_wei" ]]; then
      printf '%s' "$bal"
      return 0
    fi
    sleep "$sleep_sec"
  done

  printf '%s' "$bal"
  return 1
}

trim_quotes() {
  local s="$1"
  s="${s#\"}"
  s="${s%\"}"
  printf '%s' "$s"
}

normalize_uri_to_http() {
  local uri="$1"
  uri="$(trim_quotes "$uri")"
  if [[ "$uri" =~ ^ipfs://(.+)$ ]]; then
    printf '%s/%s' "${GATEWAY_BASE%/}" "${BASH_REMATCH[1]}"
  elif [[ "$uri" =~ ^https?:// ]]; then
    printf '%s' "$uri"
  else
    printf '%s' "$uri"
  fi
}

fetch_metadata_json() {
  local uri="$1"
  local out="$2"
  local raw
  uri="$(trim_quotes "$uri")"

  if [[ "$uri" =~ ^ipfs://(.+)$ ]]; then
    raw="$(curl -fsSL "${GATEWAY_BASE%/}/${BASH_REMATCH[1]}")" || return 1
  elif [[ "$uri" =~ ^https?:// ]]; then
    raw="$(curl -fsSL "$uri")" || return 1
  elif [[ "$uri" == "data:application/json;base64,"* ]]; then
    local b64
    b64="${uri#data:application/json;base64,}"
    raw="$(printf '%s' "$b64" | base64 --decode 2>/dev/null || printf '%s' "$b64" | base64 -D 2>/dev/null)" || return 1
  else
    return 1
  fi

  printf '%s' "$raw" | jq . > "$out"
}

upload_file_to_pinata() {
  local file_path="$1"
  local name="$2"
  local out_file="$3"

  curl -sS "https://api.pinata.cloud/pinning/pinFileToIPFS" \
    -X POST \
    -H "Authorization: Bearer ${PINATA_JWT}" \
    -F "file=@${file_path}" \
    -F "pinataMetadata={\"name\":\"${name}\"};type=application/json" \
    > "$out_file"

  local cid
  cid="$(jq -r '.IpfsHash // empty' "$out_file")"
  [[ -n "$cid" ]] || {
    echo "Pinata upload failed for $file_path" >&2
    cat "$out_file" >&2
    exit 1
  }
  printf '%s' "$cid"
}

key_for_agent_id() {
  local agent_id="$1"
  case "$agent_id" in
    32055)
      printf '%s' "${SYNTROPHIC_AGENT_222_WALLET_KEY:-${PRIVATE_KEY:-}}"
      ;;
    *)
      jq -r --argjson id "$agent_id" '.records[] | select(.agent_id == $id) | .private_key // empty' "$FINAL_KEYS_FILE"
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --registry)
      REGISTRY_ADDRESS="${2:-}"
      shift 2
      ;;
    --gateway-base)
      GATEWAY_BASE="${2:-}"
      shift 2
      ;;
    --agent-ids)
      AGENT_IDS="${2:-}"
      shift 2
      ;;
    --final-keys-file)
      FINAL_KEYS_FILE="${2:-}"
      shift 2
      ;;
    --gas-price-wei)
      GAS_PRICE_WEI="${2:-}"
      shift 2
      ;;
    --set-uri-gas-limit)
      SET_URI_GAS_LIMIT="${2:-}"
      shift 2
      ;;
    --topup-threshold-wei)
      TOPUP_THRESHOLD_WEI="${2:-}"
      shift 2
      ;;
    --topup-amount)
      TOPUP_AMOUNT="${2:-}"
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

require_cmd cast
require_cmd jq
require_cmd curl
require_cmd awk
require_cmd base64

[[ -f "$ENV_FILE" ]] || die "Env file not found: $ENV_FILE"
[[ -f "$FINAL_KEYS_FILE" ]] || die "Key map file not found: $FINAL_KEYS_FILE"

set -a
source "$ENV_FILE"
set +a

[[ -n "${BASE_RPC_URL:-}" ]] || die "BASE_RPC_URL missing in $ENV_FILE"
[[ -n "${PRIVATE_KEY:-}" ]] || die "PRIVATE_KEY missing in $ENV_FILE"
[[ -n "${PINATA_JWT:-}" ]] || die "PINATA_JWT missing in $ENV_FILE"
if [[ -z "$REGISTRY_ADDRESS" ]]; then
  REGISTRY_ADDRESS="${ERC8004_REGISTRY_ADDRESS:-}"
fi
[[ -n "$REGISTRY_ADDRESS" ]] || die "ERC8004_REGISTRY_ADDRESS missing (or use --registry)"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TMP_DIR=".secrets/logs/https_image_fix_${TIMESTAMP}"
REPORT_FILE=".secrets/wallet-batches/https_image_fix_${TIMESTAMP}.json"
mkdir -p "$TMP_DIR"

IFS=',' read -r -a IDS <<< "$AGENT_IDS"
[[ "${#IDS[@]}" -gt 0 ]] || die "No agent IDs provided"

main_wallet="$(cast wallet address --private-key "$PRIVATE_KEY")"
main_balance="$(cast balance "$main_wallet" --rpc-url "$BASE_RPC_URL")"
echo "Main wallet: $main_wallet"
echo "Main wallet balance (wei): $main_balance"
echo "Working dir: $TMP_DIR"

echo "[]" > "${TMP_DIR}/report_records.json"

for raw_id in "${IDS[@]}"; do
  agent_id="$(echo "$raw_id" | tr -d '[:space:]')"
  [[ "$agent_id" =~ ^[0-9]+$ ]] || die "Invalid agent id: $raw_id"

  echo "Processing agent ${agent_id}"

  token_uri_raw="$(cast call "$REGISTRY_ADDRESS" "tokenURI(uint256)(string)" "$agent_id" --rpc-url "$BASE_RPC_URL")"
  token_uri="$(trim_quotes "$token_uri_raw")"
  owner="$(cast call "$REGISTRY_ADDRESS" "ownerOf(uint256)(address)" "$agent_id" --rpc-url "$BASE_RPC_URL")"

  key="$(key_for_agent_id "$agent_id")"
  [[ -n "$key" && "$key" != "null" ]] || die "No private key found for agent ${agent_id}"
  signer="$(cast wallet address --private-key "$key")"
  if [[ "$(echo "$owner" | tr '[:upper:]' '[:lower:]')" != "$(echo "$signer" | tr '[:upper:]' '[:lower:]')" ]]; then
    die "Signer ${signer} is not owner ${owner} for agent ${agent_id}"
  fi

  metadata_json="${TMP_DIR}/${agent_id}_metadata.json"
  fetch_metadata_json "$token_uri" "$metadata_json" || die "Failed to fetch metadata for ${agent_id} from ${token_uri}"

  current_image="$(jq -r '.image // .image_url // empty' "$metadata_json")"
  [[ -n "$current_image" ]] || die "No image/image_url found in metadata for ${agent_id}"

  new_image="$(normalize_uri_to_http "$current_image")"
  [[ "$new_image" =~ ^https?:// ]] || die "Could not normalize image URL for ${agent_id}: ${current_image}"

  patched_json="${TMP_DIR}/${agent_id}_metadata_patched.json"
  jq --arg img "$new_image" '.image = $img | .image_url = $img' "$metadata_json" > "$patched_json"

  upload_resp="${TMP_DIR}/${agent_id}_metadata_upload.json"
  metadata_cid="$(upload_file_to_pinata "$patched_json" "agent-${agent_id}-metadata-https-image" "$upload_resp")"
  new_uri="ipfs://${metadata_cid}"

  topup_tx=""
  set_uri_tx=""
  balance_before="$(cast balance "$signer" --rpc-url "$BASE_RPC_URL")"
  required_set_uri_wei="$((SET_URI_GAS_LIMIT * GAS_PRICE_WEI))"

  if [[ "$DRY_RUN" -eq 0 ]]; then
    if [[ "$balance_before" -lt "$TOPUP_THRESHOLD_WEI" ]]; then
      echo "Top-up needed for ${signer} (balance=${balance_before})"
      topup_tx="$(
        cast send "$signer" \
          --value "$TOPUP_AMOUNT" \
          --gas-price "$GAS_PRICE_WEI" \
          --gas-limit 21000 \
          --private-key "$PRIVATE_KEY" \
          --rpc-url "$BASE_RPC_URL" \
          --async | tr -d '\r' | tail -n1 | tr -d '[:space:]'
      )"
      cast receipt "$topup_tx" --rpc-url "$BASE_RPC_URL" >/dev/null
      post_topup_balance="$(wait_for_balance_at_least "$signer" "$TOPUP_THRESHOLD_WEI" 30 1 || true)"
      echo "Post top-up observed balance for ${signer}: ${post_topup_balance}"
    fi

    current_balance="$(cast balance "$signer" --rpc-url "$BASE_RPC_URL")"
    if [[ "$current_balance" -lt "$required_set_uri_wei" ]]; then
      echo "Balance ${current_balance} is below required set-uri gas floor ${required_set_uri_wei}; sending one more top-up"
      extra_topup_tx="$(
        cast send "$signer" \
          --value "$TOPUP_AMOUNT" \
          --gas-price "$GAS_PRICE_WEI" \
          --gas-limit 21000 \
          --private-key "$PRIVATE_KEY" \
          --rpc-url "$BASE_RPC_URL" \
          --async | tr -d '\r' | tail -n1 | tr -d '[:space:]'
      )"
      cast receipt "$extra_topup_tx" --rpc-url "$BASE_RPC_URL" >/dev/null
      current_balance="$(wait_for_balance_at_least "$signer" "$required_set_uri_wei" 30 1 || cast balance "$signer" --rpc-url "$BASE_RPC_URL")"
      if [[ -z "$topup_tx" ]]; then
        topup_tx="$extra_topup_tx"
      else
        topup_tx="${topup_tx},${extra_topup_tx}"
      fi
    fi

    set_uri_tx="$(
      cast send "$REGISTRY_ADDRESS" \
        "setAgentURI(uint256,string)" "$agent_id" "$new_uri" \
        --gas-price "$GAS_PRICE_WEI" \
        --gas-limit "$SET_URI_GAS_LIMIT" \
        --private-key "$key" \
        --rpc-url "$BASE_RPC_URL" \
        --async | tr -d '\r' | tail -n1 | tr -d '[:space:]'
    )"
    cast receipt "$set_uri_tx" --rpc-url "$BASE_RPC_URL" >/dev/null
  fi

  onchain_after=""
  for _ in $(seq 1 20); do
    onchain_after="$(cast call "$REGISTRY_ADDRESS" "tokenURI(uint256)(string)" "$agent_id" --rpc-url "$BASE_RPC_URL")"
    onchain_after="$(trim_quotes "$onchain_after")"
    if [[ "$onchain_after" == "$new_uri" || "$DRY_RUN" -eq 1 ]]; then
      break
    fi
    sleep 1
  done

  record_file="${TMP_DIR}/${agent_id}_record.json"
  jq -n \
    --argjson agent_id "$agent_id" \
    --arg owner "$owner" \
    --arg signer "$signer" \
    --arg token_uri "$token_uri" \
    --arg current_image "$current_image" \
    --arg new_image "$new_image" \
    --arg metadata_cid "$metadata_cid" \
    --arg new_uri "$new_uri" \
    --arg onchain_after "$onchain_after" \
    --arg balance_before "$balance_before" \
    --arg topup_tx "$topup_tx" \
    --arg set_uri_tx "$set_uri_tx" \
    --arg upload_response_file "$upload_resp" \
    '{
      agent_id: $agent_id,
      owner: $owner,
      signer: $signer,
      old_token_uri: $token_uri,
      old_image: $current_image,
      new_image_https: $new_image,
      new_metadata_cid: $metadata_cid,
      new_token_uri: $new_uri,
      onchain_token_uri_after: $onchain_after,
      updated: ($onchain_after == $new_uri),
      signer_balance_before_wei: ($balance_before | tonumber),
      topup_tx: (if $topup_tx == "" then null else $topup_tx end),
      set_uri_tx: (if $set_uri_tx == "" then null else $set_uri_tx end),
      upload_response_file: $upload_response_file
    }' > "$record_file"

  tmp_merge="${TMP_DIR}/report_records.tmp.json"
  jq --slurp '.[0] + [.[1]]' "${TMP_DIR}/report_records.json" "$record_file" > "$tmp_merge"
  mv "$tmp_merge" "${TMP_DIR}/report_records.json"
done

jq -n \
  --arg generated_at_utc "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --arg env_file "$ENV_FILE" \
  --arg registry "$REGISTRY_ADDRESS" \
  --arg rpc "$BASE_RPC_URL" \
  --arg gateway "$GATEWAY_BASE" \
  --argjson dry_run "$DRY_RUN" \
  --arg agent_ids "$AGENT_IDS" \
  --arg main_wallet "$main_wallet" \
  --arg main_balance "$main_balance" \
  --arg records_file "${TMP_DIR}/report_records.json" \
  '{
    generated_at_utc: $generated_at_utc,
    env_file: $env_file,
    registry: $registry,
    rpc_url: $rpc,
    gateway_base: $gateway,
    dry_run: ($dry_run == 1),
    agent_ids: ($agent_ids | split(",") | map(gsub(" "; ""))),
    main_wallet: $main_wallet,
    main_wallet_balance_wei: ($main_balance | tonumber),
    records: (input)
  }' "${TMP_DIR}/report_records.json" > "$REPORT_FILE"

echo "Done."
echo "Report: $REPORT_FILE"
