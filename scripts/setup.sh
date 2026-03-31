#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────
# Syntrophic Bond Protocol — One-Command Setup
# Usage:
#   ./scripts/setup.sh              # Install deps only
#   ./scripts/setup.sh --demo       # Install + use demo env
#   ./scripts/setup.sh --demo --start  # Install + demo env + start servers
# ─────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_MODE=false
START_MODE=false

for arg in "$@"; do
  case $arg in
    --demo) DEMO_MODE=true ;;
    --start) START_MODE=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Syntrophic Bond Protocol — Setup           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Step 1: Check prerequisites ──────────────────
echo "→ Checking prerequisites..."

MISSING=()

if ! command -v forge &>/dev/null; then
  MISSING+=("forge (Foundry) — https://book.getfoundry.sh/getting-started/installation")
fi

if ! command -v cast &>/dev/null; then
  MISSING+=("cast (Foundry) — installed with Foundry")
fi

if ! command -v node &>/dev/null; then
  MISSING+=("node (Node.js >= 18) — https://nodejs.org")
fi

if ! command -v npm &>/dev/null; then
  MISSING+=("npm — installed with Node.js")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "✗ Missing required tools:"
  for tool in "${MISSING[@]}"; do
    echo "  - $tool"
  done
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "✗ Node.js >= 18 required (found v$NODE_VERSION)"
  exit 1
fi

echo "  ✓ forge $(forge --version 2>/dev/null | head -1 | awk '{print $2}')"
echo "  ✓ cast $(cast --version 2>/dev/null | head -1 | awk '{print $2}')"
echo "  ✓ node $(node -v)"
echo "  ✓ npm $(npm -v)"
echo ""

# ── Step 2: Install Foundry dependencies ─────────
echo "→ Installing protocol dependencies..."
cd "$ROOT_DIR/protocol"
if [ ! -d "lib/forge-std" ]; then
  forge install
else
  echo "  ✓ Foundry libs already installed"
fi

# ── Step 3: Compile contracts ────────────────────
echo "→ Compiling contracts..."
forge build --quiet
echo "  ✓ Contracts compiled"
echo ""

# ── Step 4: Run protocol tests ───────────────────
echo "→ Running protocol tests..."
TEST_OUTPUT=$(forge test --offline 2>&1)
PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ passed' | head -1 || echo "0 passed")
FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ failed' | head -1 || echo "0 failed")
echo "  ✓ Tests: $PASS_COUNT, $FAIL_COUNT"

if echo "$FAIL_COUNT" | grep -qv "^0"; then
  echo "  ⚠ Some tests failed. Run 'npm test -- -vvv' for details."
fi
echo ""

# ── Step 5: Install frontend dependencies ────────
echo "→ Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install --silent 2>/dev/null
echo "  ✓ Frontend dependencies installed"
echo ""

# ── Step 6: Set up environment ───────────────────
if [ "$DEMO_MODE" = true ]; then
  echo "→ Setting up demo environment..."

  # Protocol demo env (read-only, no private keys needed for verification)
  if [ ! -f "$ROOT_DIR/protocol/.env" ]; then
    cat > "$ROOT_DIR/protocol/.env" <<'DEMOENV'
# Demo environment — read-only verification only
BASE_RPC_URL=https://mainnet.base.org
ERC8004_REGISTRY_ADDRESS=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
SBP_VAULT_ADDRESS=0xFdB160B2B2f2e6189895398563D907fD8239d4e3
REGISTRY_ADAPTER_ADDRESS=0x2ADF396943421a70088d74A8281852344606D668
SYNTROPHIC_ONBOARDER_ADDRESS=0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4
AGENT_ID=32055
DEMOENV
    echo "  ✓ Created protocol/.env (demo mode — read-only)"
  else
    echo "  ✓ protocol/.env already exists"
  fi

  # Frontend env
  if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
    cat > "$ROOT_DIR/frontend/.env.local" <<'FEENV'
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_SBP_VAULT_ADDRESS=0xFdB160B2B2f2e6189895398563D907fD8239d4e3
NEXT_PUBLIC_REGISTRY_ADAPTER_ADDRESS=0x2ADF396943421a70088d74A8281852344606D668
NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
FEENV
    echo "  ✓ Created frontend/.env.local (demo mode)"
  else
    echo "  ✓ frontend/.env.local already exists"
  fi
  echo ""
fi

# ── Step 7: Verify on-chain state (if RPC available) ──
echo "→ Verifying live contracts on Base mainnet..."
if cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "BOND_AMOUNT()(uint256)" --rpc-url https://mainnet.base.org 2>/dev/null; then
  echo "  ✓ SBPVault V2 is live"
  BONDED=$(cast call 0xFdB160B2B2f2e6189895398563D907fD8239d4e3 "isBonded(uint256)(bool)" 32055 --rpc-url https://mainnet.base.org 2>/dev/null || echo "unknown")
  echo "  ✓ Agent 32055 bonded: $BONDED"
else
  echo "  ⚠ Could not reach Base RPC (offline mode — skipping verification)"
fi
echo ""

# ── Summary ──────────────────────────────────────
echo "╔══════════════════════════════════════════════╗"
echo "║   Setup Complete                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Protocol tests:  npm test"
echo "  Gas report:      npm run test:gas"
echo "  Frontend dev:    npm run dev"
echo "  On-chain verify: npm run verify:all"
echo ""
echo "  Deployed Contracts (Base Mainnet):"
echo "  ├─ Vault V2:     0xFdB160B2B2f2e6189895398563D907fD8239d4e3"
echo "  ├─ Adapter V2:   0x2ADF396943421a70088d74A8281852344606D668"
echo "  ├─ Onboarder:    0x693ABFBBfC2C5050D5Db3941DaA3F464D730A8a4"
echo "  └─ ERC-8004:     0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
echo ""
echo "  Explorer:        https://www.syntrophic.md"
echo ""

# ── Step 8: Auto-start if requested ─────────────
if [ "$START_MODE" = true ]; then
  echo "→ Starting frontend development server..."
  cd "$ROOT_DIR/frontend"
  npm run dev &
  FRONTEND_PID=$!

  # Wait for frontend to be ready
  echo "  Waiting for frontend..."
  for i in $(seq 1 30); do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
      echo "  ✓ Frontend ready at http://localhost:3000"
      break
    fi
    sleep 1
  done

  echo ""
  echo "  Frontend: http://localhost:3000  (PID: $FRONTEND_PID)"
  echo "  Press Ctrl+C to stop"
  wait $FRONTEND_PID
fi
