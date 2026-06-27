#!/usr/bin/env bash
# Set iOS CFBundleVersion — independent from Android versionCode.
#
# Strategy: use seconds-since-epoch (date +%s) as the build number. This is
# strictly monotonic (time only moves forward), so every build is guaranteed
# to be both unique AND higher than the previously uploaded version — App Store
# Connect never rejects it as a duplicate, and no manual floor bumps are ever
# needed again.
#
# The old CM_BUILD_NUMBER + IOS_BUILD_OFFSET / IOS_BUILD_NUMBER-floor scheme was
# fragile: whenever CM_BUILD_NUMBER + offset fell below the floor, every build
# stamped exactly the floor value, so the second build collided. Epoch time
# removes that failure mode entirely. (IOS_BUILD_NUMBER is still honoured as a
# hard floor safety-net, but epoch seconds always far exceed it.)
set -euo pipefail

ROOT="${CM_BUILD_DIR:-$(pwd)}"
IOS_BUILD_NUMBER="${IOS_BUILD_NUMBER:-52}"
BUILD_NUM="$IOS_BUILD_NUMBER"

# Epoch seconds: ~1.75 billion today, increasing every second. Always unique,
# always higher than the last upload.
EPOCH_BUILD="$(date +%s)"
if [ "$EPOCH_BUILD" -gt "$IOS_BUILD_NUMBER" ]; then
  BUILD_NUM="$EPOCH_BUILD"
else
  # Should never happen (epoch >> any sane floor) — defensive fallback only.
  BUILD_NUM="$IOS_BUILD_NUMBER"
fi

echo "Setting iOS CFBundleVersion to $BUILD_NUM (epoch=${EPOCH_BUILD}, floor=${IOS_BUILD_NUMBER})"

patch_pbxproj() {
  local file="$1"
  if [ ! -f "$file" ]; then
    return 0
  fi
  if [ "$(uname -s)" = "Darwin" ]; then
    sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]*/CURRENT_PROJECT_VERSION = ${BUILD_NUM}/g" "$file"
  else
    sed -i "s/CURRENT_PROJECT_VERSION = [0-9]*/CURRENT_PROJECT_VERSION = ${BUILD_NUM}/g" "$file"
  fi
}

patch_pbxproj "$ROOT/ios/App/App.xcodeproj/project.pbxproj"
patch_pbxproj "$ROOT/ios/App.xcodeproj/project.pbxproj"
patch_pbxproj "$ROOT/ios-swiftui/FrigyNative.xcodeproj/project.pbxproj"

if [ -d "$ROOT/ios/App" ] && command -v agvtool >/dev/null 2>&1; then
  (cd "$ROOT/ios/App" && agvtool new-version -all "$BUILD_NUM") || true
fi

if [ -d "$ROOT/ios-swiftui/FrigyNative.xcodeproj" ]; then
  (cd "$ROOT/ios-swiftui" && agvtool new-version -all "$BUILD_NUM") || true
fi

ACTUAL_BUILD="$(
  if [ -f "$ROOT/ios-swiftui/FrigyNative.xcodeproj/project.pbxproj" ]; then
    grep -m1 'CURRENT_PROJECT_VERSION' "$ROOT/ios-swiftui/FrigyNative.xcodeproj/project.pbxproj" \
      | sed 's/.*CURRENT_PROJECT_VERSION = //' \
      | tr -d ' ;'
  else
    grep -m1 'CURRENT_PROJECT_VERSION' "$ROOT/ios/App/App.xcodeproj/project.pbxproj" \
      | sed 's/.*CURRENT_PROJECT_VERSION = //' \
      | tr -d ' ;'
  fi
)"

echo "iOS CFBundleVersion set to $BUILD_NUM (pbxproj reports: ${ACTUAL_BUILD:-unknown})"

if [ -z "$ACTUAL_BUILD" ] || [ "$ACTUAL_BUILD" -lt "$IOS_BUILD_NUMBER" ]; then
  echo "ERROR: CFBundleVersion must be >= $IOS_BUILD_NUMBER (App Store rejects duplicate build numbers)."
  exit 1
fi

echo "$BUILD_NUM" > "$ROOT/.ios_bundle_version"
