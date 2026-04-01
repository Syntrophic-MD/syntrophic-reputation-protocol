#!/bin/bash
# setup.sh - Install dependencies and check prerequisites

echo "═══════════════════════════════════════"
echo "  Syntrophic Video Workflow Setup"
echo "═══════════════════════════════════════"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Install from https://nodejs.org"
    exit 1
fi
echo "✓ Node.js: $(node -v)"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "✗ FFmpeg not found."
    echo "  Install with: brew install ffmpeg"
    exit 1
fi
echo "✓ FFmpeg: $(ffmpeg -version | head -1)"

# Check Playwright
echo ""
echo "Checking Playwright..."
cd "$(dirname "$0")"
npm install playwright --legacy-peer-deps 2>/dev/null || npm install playwright

# Install browsers
echo ""
echo "Installing Playwright browsers..."
npx playwright install chromium

echo ""
echo "═══════════════════════════════════════"
echo "  Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Add audio files to assets/ (see assets/README.md)"
echo "  2. Edit config.json to customize your video"
echo "  3. Run: node scripts/run-all.js"
echo ""