#!/usr/bin/env bash
# Codemagic preflight — fails fast with clear messages. See docs/CODEMAGIC.md
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

normalize_p8_key

MISSING=""
require_var APP_STORE_CONNECT_KEY_IDENTIFIER
require_var APP_STORE_CONNECT_ISSUER_ID
require_var APP_STORE_CONNECT_PRIVATE_KEY
require_var VITE_SUPABASE_URL
require_var VITE_SUPABASE_PUBLISHABLE_KEY

if [ -n "$MISSING" ]; then
  echo "ERROR: Missing Codemagic environment variables:$MISSING"
  echo ""
  echo "Codemagic → frigyai → Settings → Environment variables → Add variable"
  echo "Leave Group EMPTY (Application variables) OR use any group linked to this app."
  echo ""
  echo "Required:"
  echo "  APP_STORE_CONNECT_KEY_IDENTIFIER = P5FA563XP2 (or your Key ID from AuthKey_*.p8 filename)"
  echo "  APP_STORE_CONNECT_ISSUER_ID = UUID from App Store Connect"
  echo "  APP_STORE_CONNECT_PRIVATE_KEY = full .p8 (mark Secret)"
  echo "  VITE_SUPABASE_URL"
  echo "  VITE_SUPABASE_PUBLISHABLE_KEY"
  echo "  VITE_REVENUECAT_API_KEY_IOS (recommended)"
  echo ""
  echo "See codemagic.env.example and docs/CODEMAGIC.md"
  exit 1
fi

if ! printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | grep -q "BEGIN PRIVATE KEY"; then
  echo "ERROR: APP_STORE_CONNECT_PRIVATE_KEY must include -----BEGIN PRIVATE KEY-----"
  exit 1
fi

key_len=$(printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | wc -c | tr -d ' ')
if [ "$key_len" -lt 200 ]; then
  echo "ERROR: APP_STORE_CONNECT_PRIVATE_KEY looks too short (${key_len} chars)."
  exit 1
fi

if [ -z "${VITE_REVENUECAT_API_KEY_IOS:-}" ]; then
  echo "WARNING: VITE_REVENUECAT_API_KEY_IOS not set — IAP will not work in this build."
else
  echo "VITE_REVENUECAT_API_KEY_IOS present."
fi

echo "Codemagic env OK (Apple API + Supabase; private_key ${key_len} chars)."
