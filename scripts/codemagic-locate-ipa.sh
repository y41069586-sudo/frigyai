#!/usr/bin/env bash
# After build-ipa: confirm IPA exists or print where to look in logs.
set -euo pipefail

ROOT="${CM_BUILD_DIR:-$(pwd)}"
CANDIDATES=(
  "$ROOT/ios/App/build/ios/ipa"
  "$ROOT/build/ios/ipa"
  "$HOME/build/ios/ipa"
)

echo "=== IPA search under $ROOT ==="
FOUND=""
for dir in "${CANDIDATES[@]}"; do
  if [ -d "$dir" ]; then
    echo "Directory: $dir"
    ls -la "$dir" 2>/dev/null || true
    for ipa in "$dir"/*.ipa; do
      if [ -f "$ipa" ]; then
        FOUND="$ipa"
        echo "OK: $ipa ($(du -h "$ipa" | awk '{print $1}'))"
      fi
    done
  fi
done

if [ -z "$FOUND" ]; then
  echo ""
  echo "ERROR: No .ipa file found. Build failed before export."
  echo "Open the failed step in Codemagic (often: Set up code signing, Verify signing profile, or Build IPA)."
  echo ""
  echo "All .ipa on builder:"
  find "$ROOT" -name "*.ipa" 2>/dev/null | head -20 || echo "(none)"
  echo ""
  echo "Recent xcodebuild logs:"
  find /tmp/xcodebuild_logs -type f 2>/dev/null | head -10 || echo "(no /tmp/xcodebuild_logs)"
  exit 1
fi
