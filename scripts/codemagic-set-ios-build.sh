#!/usr/bin/env bash
# Set iOS CFBundleVersion — independent from Codemagic CM_BUILD_NUMBER / Android versionCode.
set -euo pipefail

ROOT="${CM_BUILD_DIR:-$(pwd)}"
IOS_BUILD_NUMBER="${IOS_BUILD_NUMBER:-52}"
BUILD_NUM="$IOS_BUILD_NUMBER"

if [ -n "${CM_BUILD_NUMBER:-}" ] && [ "$CM_BUILD_NUMBER" -gt "$BUILD_NUM" ]; then
  BUILD_NUM="$CM_BUILD_NUMBER"
fi

echo "Setting iOS CFBundleVersion to $BUILD_NUM (IOS_BUILD_NUMBER=$IOS_BUILD_NUMBER, CM_BUILD_NUMBER=${CM_BUILD_NUMBER:-n/a})"

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

cd "$ROOT/ios/App"
if [ -d "$ROOT/ios/App" ] && command -v agvtool >/dev/null 2>&1; then
  (cd "$ROOT/ios/App" && agvtool new-version -all "$BUILD_NUM") || true
fi

if [ -d "$ROOT/ios-swiftui/FrigyNative.xcodeproj" ]; then
  cd "$ROOT/ios-swiftui"
  if command -v agvtool >/dev/null 2>&1; then
    agvtool new-version -all "$BUILD_NUM" || true
  fi
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
