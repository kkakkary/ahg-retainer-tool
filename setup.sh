#!/bin/bash
# AHG Document Creation Tool — macOS Setup Script
# Run once on a fresh Mac to install dependencies and build the app.
# Usage: bash setup.sh

set -e

echo ""
echo "=== AHG Document Creation Tool Setup ==="
echo ""

# ── 1. Install Homebrew if missing ────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon Macs
  eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
  echo "Homebrew installed."
else
  echo "Homebrew already installed."
fi

# ── 2. Install Node.js if missing ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "Installing Node.js..."
  brew install node
  echo "Node.js installed."
else
  echo "Node.js already installed: $(node --version)"
fi

# ── 3. Install LibreOffice if missing ─────────────────────────────────────────
if [ ! -d "/Applications/LibreOffice.app" ]; then
  echo "Installing LibreOffice..."
  brew install --cask libreoffice
  echo "LibreOffice installed."
else
  echo "LibreOffice already installed."
fi

# ── 4. Install npm dependencies ───────────────────────────────────────────────
echo ""
echo "Installing npm packages..."
npm install
echo "npm packages installed."

# ── 5. Build the macOS app ────────────────────────────────────────────────────
echo ""
echo "Building macOS DMG..."
npm run build
echo ""
echo "=== Build complete! ==="
echo "DMG is in the 'release' folder."
echo ""
