#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Syntrophic Reputation Protocol — One-Command Setup
# ============================================================================
# Usage:
#   ./scripts/setup.sh                # Install deps, build, test
#   ./scripts/setup.sh --demo         # Also create read-only demo env files
#   ./scripts/setup.sh --demo --start # Demo setup + start the frontend
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_MODE=false
START_MODE=false

for arg in "$@"; do
  case "$arg" in
    --demo) DEMO_MODE=true ;;
    --start) START_MODE=true ;;
    *) fail "Unknown flag: $arg" ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         Syntrophic Reputation Protocol — Setup          ║"
if [ "$DEMO_MODE" = true ]; then
  echo "║                  Mode: Demo verification                ║"
else
  echo "║                 Mode: Local development                 ║"
fi
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}[1/6] Checking prerequisites...${NC}"
MISSING=()

if ! command -v forge >/dev/null 2>&1; then
  MISSING+=("forge (Foundry) — https://book.getfoundry.sh/getting-started/installation")
fi

if ! command -v cast >/dev/null 2>&1; then
  MISSING+=("cast (Foundry) — installed with Foundry")
fi

if ! command -v node >/dev/null 2>&1; then
  MISSING+=("node (Node.js >= 18) — https://nodejs.org")
fi

if ! command -v npm >/dev/null 2>&1; then
  MISSING+=("npm — installed with Node.js")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${RED}Missing required tools:${NC}"
  for tool in "${MISSING[@]}"; do
    echo "  - $tool"
  done
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Node.js >= 18 required (found $(node -v))"
fi

pass "$(forge --version 2>/dev/null | head -1)"
pass "$(cast --version 2>/dev/null | head -1)"
pass "node $(node -v)"
pass "npm $(npm -v)"
echo ""

echo -e "${CYAN}[2/6] Installing protocol dependencies...${NC}"
cd "$ROOT_DIR/protocol"
if [ ! -d "lib/forge-std" ]; then
  forge install
  pass "Foundry dependencies installed"
else
  pass "Foundry dependencies already present"
fi
echo ""

echo -e "${CYAN}[3/6] Building and testing protocol...${NC}"
forge build --quiet
pass "Contracts compiled"

TEST_OUTPUT=$(forge test --offline 2>&1)
PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ passed' | head -1 || true)
FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ failed' | head -1 || true)

if [ -z "$PASS_COUNT" ]; then
  PASS_COUNT="unknown passed"
fi

if [ -z "$FAIL_COUNT" ]; then
  FAIL_COUNT="0 failed"
fi

if echo "$FAIL_COUNT" | grep -q '^0 failed$'; then
  pass "Protocol tests: $PASS_COUNT, $FAIL_COUNT"
else
  echo "$TEST_OUTPUT"
  fail "Protocol tests reported failures"
fi
echo ""

echo -e "${CYAN}[4/6] Installing frontend dependencies...${NC}"
cd "$ROOT_DIR/frontend"
npm install --silent >/dev/null 2>&1 || npm install
pass "Frontend dependencies installed"
echo ""

echo -e "${CYAN}[5/6] Configuring local environment...${NC}"
if [ "$DEMO_MODE" = true ]; then
  if [ ! -f "$ROOT_DIR/protocol/.env" ]; then
    cat > "$ROOT_DIR/protocol/.env" <<'DEMOENV'
# Demo environment — read-only verification only
BASE_RPC_URL=https://mainnet.base.org
ERC8004_REGISTRY_ADDRESS=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
SRP_VAULT_ADDRESS=0xFdB160B2B2f2e6189895398563D907fD8239d4e3
SBP_VAULT_ADDRESS=0xFdB160B2B2f2e6189895398563D907fD8239d4e3
REGISTRY_ADAPTER_ADDRESS=0x2ADF396943421a70088d74A8281852344606D668
SYNTROPHIC_ONBOARDER_ADDRESS=0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4
AGENT_ID=32055
DEMOENV
    pass "Created protocol/.env in demo mode"
  else
    pass "protocol/.env already exists"
  fi

  if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
    cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
    pass "Created frontend/.env.local from frontend/.env.example"
  else
    pass "frontend/.env.local already exists"
  fi
else
  warn "No demo env written. Use --demo for read-only Base verification defaults."
fi
echo ""

echo -e "${CYAN}[6/6] Validating environment...${NC}"
cd "$ROOT_DIR"
if [ "$DEMO_MODE" = true ]; then
  bash scripts/validate-env.sh --demo
else
  bash scripts/validate-env.sh
fi
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                      Setup Complete                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Quick commands:"
echo "  npm run validate      Check local tooling and Base connectivity"
echo "  npm test              Run protocol tests"
echo "  npm run dev           Start the Next.js explorer"
echo "  npm run verify:all    Verify the live Base deployment"
echo ""
echo "  Live Base contracts:"
echo "  Vault V2:     0xFdB160B2B2f2e6189895398563D907fD8239d4e3"
echo "  Adapter V2:   0x2ADF396943421a70088d74A8281852344606D668"
echo "  Onboarder:    0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4"
echo "  ERC-8004:     0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
echo ""
echo "  Explorer: https://www.syntrophic.md"
echo ""

if [ "$START_MODE" = true ]; then
  echo -e "${CYAN}Starting frontend development server...${NC}"
  cd "$ROOT_DIR/frontend"
  npm run dev &
  FRONTEND_PID=$!

  echo "  Waiting for http://localhost:3000 ..."
  for _ in $(seq 1 30); do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
      pass "Frontend ready at http://localhost:3000"
      break
    fi
    sleep 1
  done

  echo ""
  echo -e "${BOLD}Press Ctrl+C to stop the frontend${NC}"
  wait "$FRONTEND_PID"
fi
