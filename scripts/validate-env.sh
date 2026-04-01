#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Syntrophic Reputation Protocol — Environment Validation
# ============================================================================
# Usage:
#   ./scripts/validate-env.sh
#   ./scripts/validate-env.sh --demo
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
WARN=0
FAIL=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS + 1)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; WARN=$((WARN + 1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL + 1)); }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_MODE=false
if [[ "${1:-}" == "--demo" ]]; then
  DEMO_MODE=true
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Syntrophic Reputation Protocol — Validation       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}[1/5] Runtime${NC}"

if command -v forge >/dev/null 2>&1; then
  pass "$(forge --version 2>/dev/null | head -1)"
else
  fail "forge not found — install Foundry"
fi

if command -v cast >/dev/null 2>&1; then
  pass "$(cast --version 2>/dev/null | head -1)"
else
  fail "cast not found — installed with Foundry"
fi

if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    pass "node v$NODE_VERSION"
  else
    fail "node v$NODE_VERSION — need >= 18"
  fi
else
  fail "node not found — install from https://nodejs.org"
fi

if command -v npm >/dev/null 2>&1; then
  pass "npm $(npm -v)"
else
  fail "npm not found"
fi
echo ""

echo -e "${CYAN}[2/5] Project files${NC}"

if [ -d "$ROOT_DIR/protocol/lib/forge-std" ]; then
  pass "Foundry dependencies installed"
else
  fail "protocol/lib/forge-std missing — run 'cd protocol && forge install'"
fi

if [ -d "$ROOT_DIR/protocol/out" ]; then
  CONTRACT_COUNT=$(find "$ROOT_DIR/protocol/out" -name "*.json" -not -path "*/build-info/*" | wc -l | tr -d ' ')
  pass "Compiled protocol artifacts: $CONTRACT_COUNT"
else
  warn "No compiled protocol artifacts — run 'npm run build:protocol'"
fi

if [ -d "$ROOT_DIR/frontend/node_modules" ]; then
  pass "Frontend dependencies installed"
else
  warn "frontend/node_modules missing — run 'cd frontend && npm install'"
fi

if [ -f "$ROOT_DIR/frontend/.env.example" ]; then
  pass "frontend/.env.example present"
else
  warn "frontend/.env.example missing"
fi
echo ""

echo -e "${CYAN}[3/5] Environment configuration${NC}"

if [ -f "$ROOT_DIR/protocol/.env" ]; then
  pass "protocol/.env exists"

  check_env_var() {
    local var=$1
    local required=$2
    local val
    val=$(grep "^${var}=" "$ROOT_DIR/protocol/.env" 2>/dev/null | cut -d'=' -f2- || true)
    if [ -n "$val" ]; then
      if echo "$var" | grep -qiE "key|private|secret"; then
        pass "$var: ****${val: -4}"
      else
        pass "$var: $val"
      fi
    elif [ "$required" = "required" ]; then
      fail "$var not set"
    else
      warn "$var not set"
    fi
  }

  check_env_var "BASE_RPC_URL" "required"
  check_env_var "ERC8004_REGISTRY_ADDRESS" "required"

  if grep -q '^SRP_VAULT_ADDRESS=' "$ROOT_DIR/protocol/.env" 2>/dev/null; then
    check_env_var "SRP_VAULT_ADDRESS" "optional"
  else
    check_env_var "SBP_VAULT_ADDRESS" "optional"
  fi

  check_env_var "REGISTRY_ADAPTER_ADDRESS" "optional"
  check_env_var "SYNTROPHIC_ONBOARDER_ADDRESS" "optional"

  if [ "$DEMO_MODE" = false ]; then
    check_env_var "PRIVATE_KEY" "optional"
    check_env_var "BASESCAN_API_KEY" "optional"
    check_env_var "ROFL_SIGNER_ADDRESS" "optional"
    check_env_var "COMMUNITY_REWARDS_ADDRESS" "optional"
  else
    pass "Demo mode enabled — deployment credentials optional"
  fi
else
  warn "protocol/.env not found — run 'npm run setup:demo' or copy protocol/.env.example"
fi

if [ -f "$ROOT_DIR/frontend/.env.local" ] || [ -f "$ROOT_DIR/frontend/.env" ]; then
  pass "Frontend environment configured"
  FRONTEND_ENV_FILE="$ROOT_DIR/frontend/.env.local"
  if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    FRONTEND_ENV_FILE="$ROOT_DIR/frontend/.env"
  fi

  check_frontend_env_var() {
    local var=$1
    local required=$2
    local val
    val=$(grep "^${var}=" "$FRONTEND_ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)
    if [ -n "$val" ]; then
      if echo "$var" | grep -qiE "key|private|secret|jwt"; then
        pass "$var: ****${val: -4}"
      else
        pass "$var: $val"
      fi
    elif [ "$required" = "required" ]; then
      fail "$var not set in frontend env"
    else
      warn "$var not set in frontend env"
    fi
  }

  check_frontend_env_var "SPONSORED_ONBOARDER_ADDRESS" "optional"
  check_frontend_env_var "SPONSORED_ONBOARDER_PRIVATE_KEY" "optional"
  check_frontend_env_var "PINATA_JWT" "optional"
  check_frontend_env_var "X402_PAY_TO_ADDRESS" "optional"
  check_frontend_env_var "X402_FACILITATOR_URL" "optional"
else
  warn "Frontend env missing — run 'npm run setup:demo' or copy frontend/.env.example"
fi
echo ""

echo -e "${CYAN}[4/5] Base mainnet verification${NC}"

RPC_URL="https://mainnet.base.org"
if [ -f "$ROOT_DIR/protocol/.env" ]; then
  ENV_RPC_URL=$(grep '^BASE_RPC_URL=' "$ROOT_DIR/protocol/.env" 2>/dev/null | cut -d'=' -f2- || true)
  if [ -n "$ENV_RPC_URL" ]; then
    RPC_URL="$ENV_RPC_URL"
  fi
fi

VAULT_ADDRESS="0xFdB160B2B2f2e6189895398563D907fD8239d4e3"
REGISTRY_ADDRESS="0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"

if cast call "$VAULT_ADDRESS" "BOND_AMOUNT()(uint256)" --rpc-url "$RPC_URL" >/dev/null 2>&1; then
  BOND_AMOUNT=$(cast call "$VAULT_ADDRESS" "BOND_AMOUNT()(uint256)" --rpc-url "$RPC_URL" 2>/dev/null)
  pass "SRPVault V2 reachable on Base — BOND_AMOUNT=$BOND_AMOUNT"

  BONDED=$(cast call "$VAULT_ADDRESS" "isBonded(uint256)(bool)" 36105 --rpc-url "$RPC_URL" 2>/dev/null || true)
  if [ -n "$BONDED" ]; then
    pass "Agent 36105 bonded=$BONDED"
  else
    warn "Agent 36105 bonded state could not be read"
  fi

  STATUS=$(cast call "$REGISTRY_ADDRESS" "getMetadata(uint256,string)(bytes)" 36105 "syntrophic.status" --rpc-url "$RPC_URL" 2>/dev/null || true)
  if [ -n "$STATUS" ]; then
    pass "syntrophic.status metadata present"
  else
    warn "syntrophic.status metadata could not be read"
  fi
else
  warn "Base RPC unreachable — skipping live verification"
fi
echo ""

echo -e "${CYAN}[5/5] Suggested next commands${NC}"
pass "npm test"
pass "npm run dev"
pass "npm run verify:all"
echo ""

echo "═══════════════════════════════════════════════════════"
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${YELLOW}${WARN} warnings${NC}, ${RED}${FAIL} failed${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}Validation failed. Fix the errors above before proceeding.${NC}"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  exit 1
fi

if [ "$WARN" -gt 0 ]; then
  echo -e "  ${YELLOW}Validation passed with warnings. Demo mode is usually enough for review.${NC}"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  exit 0
fi

echo -e "  ${GREEN}All checks passed. Ready to work.${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
exit 0
