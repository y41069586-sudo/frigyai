#!/usr/bin/env bash
# Codemagic preflight — fails fast with clear messages. See docs/CODEMAGIC.md
set -euo pipefail

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ] || [ "$value" = "undefined" ]; then
    MISSING="${MISSING} ${name}"
  fi
}

MISSING=""
require_var APP_STORE_CONNECT_KEY_IDENTIFIER
require_var APP_STORE_CONNECT_ISSUER_ID
require_var APP_STORE_CONNECT_PRIVATE_KEY
require_var VITE_SUPABASE_URL
require_var VITE_SUPABASE_PUBLISHABLE_KEY

if [ -n "$MISSING" ]; then
  echo "ERROR: Missing Codemagic environment variables:$MISSING"
  echo ""
  echo "Apple signing (group must be named exactly: appstore_credentials):"
  echo "  APP_STORE_CONNECT_KEY_IDENTIFIER"
  echo "  APP_STORE_CONNECT_ISSUER_ID"
  echo "  APP_STORE_CONNECT_PRIVATE_KEY  (Secret, full .p8 contents)"
  echo ""
  echo "App build (add in same group OR as Application variables without group):"
  echo "  VITE_SUPABASE_URL"
  echo "  VITE_SUPABASE_PUBLISHABLE_KEY"
  echo "  VITE_REVENUECAT_API_KEY_IOS  (recommended)"
  echo ""
  echo "Codemagic → frigyai → Settings → Environment variables"
  echo "docs/CODEMAGIC.md"
  exit 1
fi

key_len=$(printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | wc -c | tr -d ' ')
if [ "$key_len" -lt 200 ]; then
  echo "ERROR: APP_STORE_CONNECT_PRIVATE_KEY looks too short (${key_len} chars)."
  echo "Paste the entire .p8 file including BEGIN/END lines."
  exit 1
fi

if [ -z "${VITE_REVENUECAT_API_KEY_IOS:-}" ]; then
  echo "WARNING: VITE_REVENUECAT_API_KEY_IOS not set — IAP will not work in this build."
else
  echo "VITE_REVENUECAT_API_KEY_IOS present."
fi

echo "Codemagic env OK (Apple API + Supabase; private_key ${key_len} chars)."
