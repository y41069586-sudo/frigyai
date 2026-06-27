#!/usr/bin/env bash
# Build Vite web app and copy Capacitor bundle into FrigyNative for full-app TestFlight builds.
set -euo pipefail

ROOT="${CM_BUILD_DIR:-$(pwd)}"
NATIVE_WEB="$ROOT/ios-swiftui/FrigyNative"

cd "$ROOT"

echo "Installing npm dependencies..."
npm ci --legacy-peer-deps

echo "Building web app (Vite → dist/)..."
npm run build
test -d dist || (echo "ERROR: dist/ missing after vite build" && exit 1)

echo "Syncing Capacitor iOS project..."
npx cap sync ios
test -d ios/App/App/public || (echo "ERROR: cap sync did not copy web assets" && exit 1)

if [ "$(uname -s)" = "Darwin" ]; then
  sed -i '' 's|\\|/|g' ios/App/CapApp-SPM/Package.swift
else
  sed -i 's|\\|/|g' ios/App/CapApp-SPM/Package.swift
fi

echo "Copying web bundle into FrigyNative..."
rm -rf "$NATIVE_WEB/public"
cp -R ios/App/App/public "$NATIVE_WEB/public"
test -f "$NATIVE_WEB/public/index.html" || (echo "ERROR: public/index.html missing" && exit 1)

if [ -f ios/App/App/capacitor.config.json ]; then
  cp ios/App/App/capacitor.config.json "$NATIVE_WEB/capacitor.config.json"
else
  echo "ERROR: ios/App/App/capacitor.config.json missing after cap sync"
  exit 1
fi

echo "Web bundle ready at $NATIVE_WEB/public ($(du -sh "$NATIVE_WEB/public" | cut -f1))"
