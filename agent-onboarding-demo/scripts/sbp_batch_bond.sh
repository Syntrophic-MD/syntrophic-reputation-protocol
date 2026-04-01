#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

ENV_FILE=".secrets/main.env"
AGENTS_FILE=".secrets/wallet-batches/agents_222_227_wallets.json"
IDS=""
GAS_PRICE_WEI=""
BOND_GAS_LIMIT="250000"
GAS_BUFFER_WEI="600000000000"
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage:
  scripts/sbp_batch_bond.sh [options]

Options:
      --env-file <PATH>        Env file path (default: .secrets/main.env)
      --agents-file <PATH>     Agents JSON path (default: .secrets/wallet-batches/agents_222_227_wallets.json)
      --ids <CSV>              Comma-separated agent IDs to process (default: all in agents file)
      --gas-price-wei <WEI>    Explicit gas price in wei
      --bond-gas-limit <N>     Gas limit for bond tx (default: 250000)
      --gas-buffer-wei <WEI>   Extra wallet balance required above bond amount (default: 600000000000 wei)
      --dry-run                Preflight only, do not broadcast transactions
  -h, --help                   Show this help

Required env vars in env file:
  BASE_RPC_URL
  ERC8004_REGISTRY_ADDRESS
  SBP_VAULT_ADDRESS
  PRIVATE_KEY    # funding wallet for deficit top-ups
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

to_lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

json_hex_to_dec() {
  local json="$1"
  local key="$2"
  local value
  value="$(jq -r --arg key "$key" '.[$key] // "0x0"' <<<"$json")"
  cast to-dec "$value"
}

calculate_fee_from_receipt() {
  local receipt_json="$1"
  local gas_used
  local effective_gas_price
  local l1_fee
  local l2_fee
  local total_fee

  gas_used="$(json_hex_to_dec "$receipt_json" "gasUsed")"
  effective_gas_price="$(json_hex_to_dec "$receipt_json" "effectiveGasPrice")"
  l1_fee="$(json_hex_to_dec "$receipt_json" "l1Fee")"

  l2_fee=$((gas_used * effective_gas_price))
  total_fee=$((l2_fee + l1_fee))
  printf '%s' "$total_fee"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --agents-file)
      AGENTS_FILE="${2:-}"
      shift 2
      ;;
    --ids)
      IDS="${2:-}"
      shift 2
      ;;
    --gas-price-wei)
      GAS_PRICE_WEI="${2:-}"
      shift 2
      ;;
    --bond-gas-limit)
      BOND_GAS_LIMIT="${2:-}"
      shift 2
      ;;
    --gas-buffer-wei)
      GAS_BUFFER_WEI="${2:-}"
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

[[ -f "$ENV_FILE" ]] || die "Env file not found: $ENV_FILE"
[[ -f "$AGENTS_FILE" ]] || die "Agents file not found: $AGENTS_FILE"
[[ "$BOND_GAS_LIMIT" =~ ^[1-9][0-9]*$ ]] || die "--bond-gas-limit must be a positive integer"
[[ "$GAS_BUFFER_WEI" =~ ^[0-9]+$ ]] || die "--gas-buffer-wei must be an integer in wei"
if [[ -n "$GAS_PRICE_WEI" && ! "$GAS_PRICE_WEI" =~ ^[0-9]+$ ]]; then
  die "--gas-price-wei must be an integer in wei"
fi

require_cmd cast
require_cmd jq

set -a
source "$ENV_FILE"
set +a

for var in BASE_RPC_URL ERC8004_REGISTRY_ADDRESS SBP_VAULT_ADDRESS PRIVATE_KEY; do
  [[ -n "${!var:-}" ]] || die "Required env var missing in ${ENV_FILE}: ${var}"
done

[[ -s "$AGENTS_FILE" ]] || die "Agents file is empty: $AGENTS_FILE"

chain_id="$(cast chain-id --rpc-url "$BASE_RPC_URL")"
[[ "$chain_id" == "8453" ]] || die "Expected Base chain id 8453, got ${chain_id}"

funder_address="$(cast wallet address --private-key "$PRIVATE_KEY")"
funder_balance_start="$(cast balance "$funder_address" --rpc-url "$BASE_RPC_URL")"
bond_amount_wei="$(cast call "$SBP_VAULT_ADDRESS" "BOND_AMOUNT()(uint256)" --rpc-url "$BASE_RPC_URL" | awk '{print $1}')"
[[ "$bond_amount_wei" =~ ^[0-9]+$ ]] || die "Could not parse BOND_AMOUNT from vault"

IDS_FILTER_CSV=""
if [[ -n "$IDS" ]]; then
  while IFS= read -r id; do
    [[ -z "$id" ]] && continue
    [[ "$id" =~ ^[0-9]+$ ]] || die "Invalid agent id in --ids: $id"
  done < <(printf '%s' "$IDS" | tr ',' '\n' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  IDS_FILTER_CSV=",$(printf '%s' "$IDS" | tr -d '[:space:]'),"
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT_FILE=".secrets/wallet-batches/sbp_bond_report_${TIMESTAMP}.json"
SUMMARY_FILE=".secrets/wallet-batches/sbp_bond_summary_${TIMESTAMP}.csv"
TMP_REPORT="${REPORT_FILE}.tmp"
echo '[]' > "$REPORT_FILE"

log "Starting SBP batch bond"
log "Funder wallet: ${funder_address}"
log "Funder balance start: ${funder_balance_start} wei"
log "Bond amount: ${bond_amount_wei} wei"
log "Gas buffer per wallet: ${GAS_BUFFER_WEI} wei"
[[ -n "$GAS_PRICE_WEI" ]] && log "Using explicit gas price: ${GAS_PRICE_WEI} wei"
[[ "$DRY_RUN" -eq 1 ]] && log "Dry run enabled: no tx broadcast"

topup_total_wei=0
bond_value_total_wei=0
gas_total_wei=0
processed=0

while IFS= read -r row; do
  [[ -z "$row" ]] && continue
  agent_id="$(jq -r '.agent_id' <<<"$row")"
  name="$(jq -r '.name' <<<"$row")"
  expected_address="$(jq -r '.address' <<<"$row")"
  wallet_pk="$(jq -r '.private_key' <<<"$row")"

  if [[ -n "$IDS_FILTER_CSV" && "$IDS_FILTER_CSV" != *",$agent_id,"* ]]; then
    continue
  fi

  processed=$((processed + 1))
  log "Processing agentId=${agent_id} (${name})"

  wallet_address="$(cast wallet address --private-key "$wallet_pk")"
  [[ "$(to_lower "$wallet_address")" == "$(to_lower "$expected_address")" ]] || die "Address mismatch for agent ${agent_id}"

  owner_onchain="$(cast call "$ERC8004_REGISTRY_ADDRESS" "ownerOf(uint256)(address)" "$agent_id" --rpc-url "$BASE_RPC_URL")"
  [[ "$(to_lower "$owner_onchain")" == "$(to_lower "$wallet_address")" ]] || die "Owner mismatch for agent ${agent_id}"

  is_bonded="$(cast call "$SBP_VAULT_ADDRESS" "isBonded(uint256)(bool)" "$agent_id" --rpc-url "$BASE_RPC_URL" | tr -d '"')"
  balance_wei_before="$(cast balance "$wallet_address" --rpc-url "$BASE_RPC_URL")"

  gas_reserve_wei=0
  if [[ -n "$GAS_PRICE_WEI" ]]; then
    gas_reserve_wei=$((BOND_GAS_LIMIT * GAS_PRICE_WEI))
  fi
  required_wei=$((bond_amount_wei + gas_reserve_wei + GAS_BUFFER_WEI))
  deficit_wei=0
  if (( balance_wei_before < required_wei )); then
    deficit_wei=$((required_wei - balance_wei_before))
  fi

  topup_tx_hash=""
  bond_tx_hash=""
  topup_fee_wei=0
  bond_fee_wei=0
  balance_wei_after="$balance_wei_before"
  status="skipped"
  status_reason=""

  if [[ "$is_bonded" == "true" ]]; then
    status="already_bonded"
    status_reason="isBonded returned true"
    log "  already bonded; skipping write tx"
  else
    if (( deficit_wei > 0 )); then
      if [[ "$DRY_RUN" -eq 0 ]]; then
        if [[ -n "$GAS_PRICE_WEI" ]]; then
          topup_tx_hash="$(
            cast send "$wallet_address" \
              --value "${deficit_wei}wei" \
              --gas-price "$GAS_PRICE_WEI" \
              --gas-limit 21000 \
              --private-key "$PRIVATE_KEY" \
              --rpc-url "$BASE_RPC_URL" \
              --async | normalize_tx_hash
          )"
        else
          topup_tx_hash="$(
            cast send "$wallet_address" \
              --value "${deficit_wei}wei" \
              --gas-limit 21000 \
              --private-key "$PRIVATE_KEY" \
              --rpc-url "$BASE_RPC_URL" \
              --async | normalize_tx_hash
          )"
        fi
        [[ "$topup_tx_hash" =~ ^0x[0-9a-fA-F]{64}$ ]] || die "Invalid topup tx hash for agent ${agent_id}"
        topup_receipt="$(cast receipt "$topup_tx_hash" --rpc-url "$BASE_RPC_URL" --json)"
        topup_fee_wei="$(calculate_fee_from_receipt "$topup_receipt")"
      fi
      topup_total_wei=$((topup_total_wei + deficit_wei))
      log "  topup required: ${deficit_wei} wei"
    fi

    if [[ "$DRY_RUN" -eq 0 ]]; then
      if [[ -n "$GAS_PRICE_WEI" ]]; then
        bond_tx_hash="$(
          cast send "$SBP_VAULT_ADDRESS" \
            "bond(uint256)" "$agent_id" \
            --value "${bond_amount_wei}wei" \
            --gas-price "$GAS_PRICE_WEI" \
            --gas-limit "$BOND_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      else
        bond_tx_hash="$(
          cast send "$SBP_VAULT_ADDRESS" \
            "bond(uint256)" "$agent_id" \
            --value "${bond_amount_wei}wei" \
            --gas-limit "$BOND_GAS_LIMIT" \
            --private-key "$wallet_pk" \
            --rpc-url "$BASE_RPC_URL" \
            --async | normalize_tx_hash
        )"
      fi
      [[ "$bond_tx_hash" =~ ^0x[0-9a-fA-F]{64}$ ]] || die "Invalid bond tx hash for agent ${agent_id}"
      bond_receipt="$(cast receipt "$bond_tx_hash" --rpc-url "$BASE_RPC_URL" --json)"
      bond_fee_wei="$(calculate_fee_from_receipt "$bond_receipt")"

      is_bonded_after="false"
      for _ in $(seq 1 10); do
        is_bonded_after="$(cast call "$SBP_VAULT_ADDRESS" "isBonded(uint256)(bool)" "$agent_id" --rpc-url "$BASE_RPC_URL" | tr -d '"')"
        if [[ "$is_bonded_after" == "true" ]]; then
          break
        fi
        sleep 2
      done
      if [[ "$is_bonded_after" == "true" ]]; then
        status="bonded"
        status_reason="bond tx succeeded and isBonded=true"
        bond_value_total_wei=$((bond_value_total_wei + bond_amount_wei))
      else
        status="failed_verify"
        status_reason="bond tx sent but isBonded not true"
      fi
    else
      status="dry_run"
      status_reason="preflight only"
    fi

    balance_wei_after="$(cast balance "$wallet_address" --rpc-url "$BASE_RPC_URL")"
  fi

  gas_total_wei=$((gas_total_wei + topup_fee_wei + bond_fee_wei))
  metadata_status_hex="$(cast call "$ERC8004_REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" "$agent_id" "syntrophic.status" --rpc-url "$BASE_RPC_URL" || true)"

  jq \
    --arg agent_id "$agent_id" \
    --arg name "$name" \
    --arg address "$wallet_address" \
    --arg owner_onchain "$owner_onchain" \
    --arg is_bonded_before "$is_bonded" \
    --arg metadata_status_hex "$metadata_status_hex" \
    --arg balance_before "$balance_wei_before" \
    --arg balance_after "$balance_wei_after" \
    --arg required_wei "$required_wei" \
    --arg deficit_wei "$deficit_wei" \
    --arg topup_tx "$topup_tx_hash" \
    --arg topup_fee_wei "$topup_fee_wei" \
    --arg bond_tx "$bond_tx_hash" \
    --arg bond_fee_wei "$bond_fee_wei" \
    --arg status "$status" \
    --arg status_reason "$status_reason" \
    '. + [{
      agent_id: ($agent_id|tonumber),
      name: $name,
      address: $address,
      owner_onchain: $owner_onchain,
      is_bonded_before: $is_bonded_before,
      metadata_status_hex: $metadata_status_hex,
      balance_wei_before: ($balance_before|tonumber),
      balance_wei_after: ($balance_after|tonumber),
      required_wei: ($required_wei|tonumber),
      deficit_wei: ($deficit_wei|tonumber),
      topup_tx: (if $topup_tx == "" then null else $topup_tx end),
      topup_fee_wei: ($topup_fee_wei|tonumber),
      bond_tx: (if $bond_tx == "" then null else $bond_tx end),
      bond_fee_wei: ($bond_fee_wei|tonumber),
      status: $status,
      status_reason: $status_reason
    }]' "$REPORT_FILE" > "$TMP_REPORT"
  mv "$TMP_REPORT" "$REPORT_FILE"
done < <(jq -c '.[]' "$AGENTS_FILE")

(( processed > 0 )) || die "No agents selected. Check --ids or agents file."

funder_balance_end="$(cast balance "$funder_address" --rpc-url "$BASE_RPC_URL")"

jq -r '
  ["agent_id","name","status","deficit_wei","topup_tx","bond_tx","balance_wei_before","balance_wei_after"],
  (.[] | [
    (.agent_id|tostring),
    .name,
    .status,
    (.deficit_wei|tostring),
    (.topup_tx // ""),
    (.bond_tx // ""),
    (.balance_wei_before|tostring),
    (.balance_wei_after|tostring)
  ]) | @csv
' "$REPORT_FILE" > "$SUMMARY_FILE"

log "Completed. Report: ${REPORT_FILE}"
log "Summary: ${SUMMARY_FILE}"
log "Topup value total: ${topup_total_wei} wei"
log "Bond principal total: ${bond_value_total_wei} wei"
log "Known tx gas total: ${gas_total_wei} wei"
log "Funder balance end: ${funder_balance_end} wei"
