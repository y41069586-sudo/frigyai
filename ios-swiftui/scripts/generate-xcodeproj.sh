#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "xcodegen not found. Install: brew install xcodegen"
  exit 1
fi

if [[ ! -f Config/Secrets.xcconfig ]]; then
  echo "Creating Config/Secrets.xcconfig from example..."
  cp Config/Secrets.xcconfig.example Config/Secrets.xcconfig
fi

xcodegen generate
echo "Generated FrigyNative.xcodeproj — open with Xcode 26."
