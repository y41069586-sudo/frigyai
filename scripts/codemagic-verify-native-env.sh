#!/usr/bin/env bash
# Preflight for ios-swiftui-build — Supabase + optional ASC; no npm / RevenueCat required.
set -euo pipefail

normalize_p8_key() {
  if [ -n "${APP_STORE_CONNECT_PRIVATE_KEY:-}" ] && ! printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | grep -q "BEGIN PRIVATE KEY"; then
    export APP_STORE_CONNECT_PRIVATE_KEY
    APP_STORE_CONNECT_PRIVATE_KEY="$(printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | sed 's/\\n/\n/g')"
    export APP_STORE_CONNECT_PRIVATE_KEY
  fi
}

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ] || [ "$value" = "undefined" ]; then
    MISSING="${MISSING} ${name}"
  fi
}

has_asc_key() {
  [ -n "${APP_STORE_CONNECT_KEY_IDENTIFIER:-}" ] && \
  [ -n "${APP_STORE_CONNECT_ISSUER_ID:-}" ] && \
  [ -n "${APP_STORE_CONNECT_PRIVATE_KEY:-}" ]
}

normalize_p8_key

MISSING=""
require_var VITE_SUPABASE_URL
require_var VITE_SUPABASE_PUBLISHABLE_KEY

if [ -n "$MISSING" ]; then
  echo "ERROR: Missing required Codemagic environment variables:$MISSING"
  echo "Native SwiftUI build maps:"
  echo "  VITE_SUPABASE_URL        → SUPABASE_URL (Secrets.xcconfig)"
  echo "  VITE_SUPABASE_PUBLISHABLE_KEY → SUPABASE_ANON_KEY"
  exit 1
fi

if has_asc_key; then
  if ! printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | grep -q "BEGIN PRIVATE KEY"; then
    echo "ERROR: APP_STORE_CONNECT_PRIVATE_KEY must include -----BEGIN PRIVATE KEY-----"
    exit 1
  fi
  echo "APP_STORE_CONNECT API key present."
else
  echo "NOTE: APP_STORE_CONNECT_* not set — OK if signing uses Team → Code signing identities (Frigy + frigy_distribution)."
fi

echo "Native SwiftUI env OK (Supabase + signing prerequisites). RevenueCat not required for this workflow."
