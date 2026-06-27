#!/usr/bin/env bash
# Comprehensive build settings verification for ios-swiftui-build
set -euo pipefail

echo "=== iOS SwiftUI Build Settings Verification ==="

ROOT="${CM_BUILD_DIR:-$(pwd)}"
PROJECT="$ROOT/ios-swiftui/FrigyNative.xcodeproj"
SCHEME="${XCODE_SCHEME:-FrigyNative}"

if [ ! -d "$PROJECT" ]; then
  echo "ERROR: Project not found at $PROJECT"
  exit 1
fi

echo ""
echo "Project: $PROJECT"
echo "Scheme: $SCHEME"
echo ""

echo "=== Xcode Version ==="
xcode-select --print-path
xcodebuild -version

echo ""
echo "=== Build Environment ==="
echo "Swift version: $(swift --version)"
echo "Deployment target: ${IPHONEOS_DEPLOYMENT_TARGET:-not set}"
echo "Swift version setting: ${SWIFT_VERSION:-not set}"
echo "Strict concurrency: ${SWIFT_STRICT_CONCURRENCY:-not set}"

echo ""
echo "=== Project Build Settings ==="
xcodebuild -project "$PROJECT" -scheme "$SCHEME" -showBuildSettings 2>/dev/null | \
  grep -E 'SWIFT_VERSION|SWIFT_STRICT_CONCURRENCY|IPHONEOS_DEPLOYMENT_TARGET|ONLY_ACTIVE_ARCH|CLANG_ENABLE_MODULES' | \
  sed 's/^[[:space:]]*//' | sort | uniq

echo ""
echo "=== Package Dependencies ==="
if [ -f "$ROOT/ios-swiftui/project.yml" ]; then
  grep -A 10 "^packages:" "$ROOT/ios-swiftui/project.yml" | grep -E "url:|from:" || echo "(No SPM packages found)"
else
  echo "project.yml not found"
fi

echo ""
echo "=== Disk Space ==="
df -h "$ROOT" | tail -1

echo ""
echo "=== Derived Data Status ==="
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA" ]; then
  DERIVED_SIZE=$(du -sh "$DERIVED_DATA" 2>/dev/null | awk '{print $1}')
  echo "Derived Data size: $DERIVED_SIZE"
  FRIGY_DERIVED=$(find "$DERIVED_DATA" -maxdepth 1 -type d -name "*FrigyNative*" 2>/dev/null | wc -l)
  echo "FrigyNative build folders: $FRIGY_DERIVED"
else
  echo "Derived Data directory not found (will be created on first build)"
fi

echo ""
echo "=== Framework Status ==="
# List imported frameworks to verify linking
xcodebuild -project "$PROJECT" -scheme "$SCHEME" -showBuildSettings 2>/dev/null | \
  grep -E 'FRAMEWORK_SEARCH_PATHS|FRAMEWORK_BUILD_PATH' | \
  sed 's/^[[:space:]]*//' | head -5 || echo "No framework paths to display"

echo ""
echo "✓ Build environment verified"
