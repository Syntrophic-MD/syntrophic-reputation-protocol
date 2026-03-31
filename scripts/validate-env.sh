#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────
# Syntrophic Bond Protocol — Environment Validator
# Checks all prerequisites and configuration
# ─────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0
WARNINGS=0

echo ""
echo "Syntrophic Bond Protocol — Environment Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Tools ────────────────────────────────────────
echo "[Tools]"

check_tool() {
  local name=$1
  local install_hint=$2
  if command -v "$name" &>/dev/null; then
    local version
    version=$("$name" --version 2>/dev/null | head -1 || echo "installed")
    echo "  ✓ $name: $version"
  else
    echo "  ✗ $name: NOT FOUND — $install_hint"
    ERRORS=$((ERRORS + 1))
  fi
}

check_tool "forge" "curl -L https://foundry.paradigm.xyz | bash && foundryup"
check_tool "cast" "installed with Foundry"
check_tool "node" "https://nodejs.org (>= 18 required)"
check_tool "npm" "installed with Node.js"
check_tool "git" "https://git-scm.com"

if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -lt 18 ]; then
    echo "  ✗ Node.js version >= 18 required (found v$NODE_VER)"
    ERRORS=$((ERRORS + 1))
  fi
fi
echo ""

# ── Protocol Environment ────────────────────────
echo "[Protocol Environment]"

if [ -f "$ROOT_DIR/protocol/.env" ]; then
  echo "  ✓ protocol/.env exists"

  check_env_var() {
    local var=$1
    local required=$2
    local val
    val=$(grep "^${var}=" "$ROOT_DIR/protocol/.env" 2>/dev/null | cut -d'=' -f2- || echo "")
    if [ -n "$val" ] && [ "$val" != "" ]; then
      # Mask sensitive values
      if echo "$var" | grep -qiE "key|private|secret"; then
        echo "  ✓ $var: ****${val: -4}"
      else
        echo "  ✓ $var: $val"
      fi
    elif [ "$required" = "required" ]; then
      echo "  ✗ $var: NOT SET (required for deployment)"
      ERRORS=$((ERRORS + 1))
    else
      echo "  ⚠ $var: not set (optional)"
      WARNINGS=$((WARNINGS + 1))
    fi
  }

  check_env_var "BASE_RPC_URL" "required"
  check_env_var "ERC8004_REGISTRY_ADDRESS" "required"
  check_env_var "SBP_VAULT_ADDRESS" "optional"
  check_env_var "REGISTRY_ADAPTER_ADDRESS" "optional"
  check_env_var "PRIVATE_KEY" "optional"
  check_env_var "BASESCAN_API_KEY" "optional"
  check_env_var "ROFL_SIGNER_ADDRESS" "optional"
  check_env_var "COMMUNITY_REWARDS_ADDRESS" "optional"
else
  echo "  ⚠ protocol/.env not found — run 'npm run setup:demo' or copy protocol/.env.example"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ── Protocol Build ───────────────────────────────
echo "[Protocol Build]"

if [ -d "$ROOT_DIR/protocol/out" ]; then
  CONTRACT_COUNT=$(find "$ROOT_DIR/protocol/out" -name "*.json" -not -path "*/build-info/*" | wc -l | tr -d ' ')
  echo "  ✓ Compiled artifacts: $CONTRACT_COUNT"
else
  echo "  ⚠ No compiled artifacts — run 'npm run build:protocol'"
  WARNINGS=$((WARNINGS + 1))
fi

if [ -d "$ROOT_DIR/protocol/lib/forge-std" ]; then
  echo "  ✓ Foundry dependencies installed"
else
  echo "  ✗ Foundry dependencies missing — run 'cd protocol && forge install'"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ── Frontend ─────────────────────────────────────
echo "[Frontend]"

if [ -d "$ROOT_DIR/frontend/node_modules" ]; then
  echo "  ✓ node_modules installed"
else
  echo "  ⚠ node_modules missing — run 'cd frontend && npm install'"
  WARNINGS=$((WARNINGS + 1))
fi

if [ -f "$ROOT_DIR/frontend/.env.local" ] || [ -f "$ROOT_DIR/frontend/.env" ]; then
  echo "  ✓ Frontend environment configured"
else
  echo "  ⚠ No frontend .env — run 'npm run setup:demo' or copy frontend/.env.example"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ── Live Contract Verification ───────────────────
echo "[On-Chain Verification]"

RPC_URL="https://mainnet.base.org"
if cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "BOND_AMOUNT()(uint256)" --rpc-url "$RPC_URL" &>/dev/null; then
  BOND_AMT=$(cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "BOND_AMOUNT()(uint256)" --rpc-url "$RPC_URL" 2>/dev/null)
  echo "  ✓ Vault V2 live — BOND_AMOUNT = $BOND_AMT wei"

  BONDED=$(cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "isBonded(uint256)(bool)" 32055 --rpc-url "$RPC_URL" 2>/dev/null || echo "error")
  echo "  ✓ Agent 32055 bonded = $BONDED"

  STATUS=$(cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.status" --rpc-url "$RPC_URL" 2>/dev/null || echo "error")
  echo "  ✓ syntrophic.status = $STATUS"
else
  echo "  ⚠ Cannot reach Base RPC — skipping on-chain checks"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ── Summary ──────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -gt 0 ]; then
  echo "  ✗ $ERRORS error(s), $WARNINGS warning(s)"
  echo "  Fix errors above before proceeding."
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "  ✓ No errors, $WARNINGS warning(s)"
  echo "  Environment is functional. Warnings are optional."
  exit 0
else
  echo "  ✓ All checks passed"
  exit 0
fi
