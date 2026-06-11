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
        IOS_MIN_BUILD="${IOS_MIN_BUILD:-17}"
        BUNDLE_VERSION=""
        if command -v unzip >/dev/null && command -v plutil >/dev/null; then
          INFO_PLIST="$(mktemp)"
          unzip -p "$ipa" "Payload/"*.app/Info.plist >"$INFO_PLIST" 2>/dev/null || true
          if [ -s "$INFO_PLIST" ]; then
            BUNDLE_VERSION="$(plutil -extract CFBundleVersion raw -o - "$INFO_PLIST" 2>/dev/null || true)"
          fi
          rm -f "$INFO_PLIST"
        fi
        if [ -n "$BUNDLE_VERSION" ]; then
          echo "CFBundleVersion in IPA: $BUNDLE_VERSION (minimum required: $IOS_MIN_BUILD)"
          if [ "$BUNDLE_VERSION" -lt "$IOS_MIN_BUILD" ]; then
            echo "ERROR: IPA CFBundleVersion $BUNDLE_VERSION is too low for App Store Connect."
            echo "Rebuild from latest main (IOS_MIN_BUILD=$IOS_MIN_BUILD) or bump IOS_MIN_BUILD in codemagic.yaml."
            exit 1
          fi
        else
          echo "WARNING: Could not read CFBundleVersion from IPA (skipping version gate)."
        fi
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
