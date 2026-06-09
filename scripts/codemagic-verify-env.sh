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

has_asc_key() {
  [ -n "${APP_STORE_CONNECT_KEY_IDENTIFIER:-}" ] && \
  [ -n "${APP_STORE_CONNECT_ISSUER_ID:-}" ] && \
  [ -n "${APP_STORE_CONNECT_PRIVATE_KEY:-}" ]
}

normalize_p8_key

# Require RevenueCat keys per workflow (not both on every build).
WORKFLOW="${CM_WORKFLOW_NAME:-}"
REQUIRE_IOS_REVENUECAT=0
REQUIRE_ANDROID_REVENUECAT=0
case "$WORKFLOW" in
  *ios*|*iOS*) REQUIRE_IOS_REVENUECAT=1 ;;
  *android*|*Android*)
    REQUIRE_IOS_REVENUECAT=0
    REQUIRE_ANDROID_REVENUECAT=0
    ;;
  *)
    # Unknown workflow — require both unless explicitly relaxed
    REQUIRE_IOS_REVENUECAT=1
    REQUIRE_ANDROID_REVENUECAT=1
    ;;
esac
echo "Workflow: ${WORKFLOW:-unknown} (iOS RC required=${REQUIRE_IOS_REVENUECAT}, Android RC required=${REQUIRE_ANDROID_REVENUECAT})"

MISSING=""
require_var VITE_SUPABASE_URL
require_var VITE_SUPABASE_PUBLISHABLE_KEY

if [ -n "$MISSING" ]; then
  echo "ERROR: Missing required Codemagic environment variables:$MISSING"
  echo ""
  echo "Names visible in this build (values hidden):"
  env | grep -E '^(APP_STORE_CONNECT|VITE_)' | sed 's/=.*//' | sort -u || true
  if [ -z "$(env | grep -E '^(APP_STORE_CONNECT|VITE_)' || true)" ]; then
    echo "  (none) — variables exist in UI but are NOT injected into the workflow."
    echo "  Fix: Codemagic → frigyai → Environment variables → Group must be exactly: frigy"
    echo "       (or remove groups: from codemagic.yaml and leave Group empty on each var)"
  fi
  echo ""
  echo "Required for every iOS build:"
  echo "  VITE_SUPABASE_URL"
  echo "  VITE_SUPABASE_PUBLISHABLE_KEY"
  echo ""
  echo "See codemagic.env.example and docs/CODEMAGIC.md"
  exit 1
fi

if has_asc_key; then
  if ! printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | grep -q "BEGIN PRIVATE KEY"; then
    echo "ERROR: APP_STORE_CONNECT_PRIVATE_KEY must include -----BEGIN PRIVATE KEY-----"
    exit 1
  fi
  key_len=$(printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" | wc -c | tr -d ' ')
  if [ "$key_len" -lt 200 ]; then
    echo "ERROR: APP_STORE_CONNECT_PRIVATE_KEY looks too short (${key_len} chars)."
    exit 1
  fi
  echo "APP_STORE_CONNECT API key present (${key_len} chars)."
else
  echo "NOTE: APP_STORE_CONNECT_* not set — OK if signing uses Team → Code signing identities (Frigy + frigy_distribution)."
fi

if [ -z "${VITE_REVENUECAT_API_KEY_IOS:-}" ]; then
  if [ "$REQUIRE_IOS_REVENUECAT" = "1" ]; then
    echo "ERROR: VITE_REVENUECAT_API_KEY_IOS not set — iOS IAP will fail App Store review."
    echo "Add appl_… key from RevenueCat to Codemagic group 'frigy' (see docs/STORE_BILLING_SETUP.md)."
    exit 1
  fi
  echo "WARNING: VITE_REVENUECAT_API_KEY_IOS not set — skipped for this workflow."
else
  echo "VITE_REVENUECAT_API_KEY_IOS present."
fi

if [ -z "${VITE_REVENUECAT_API_KEY_ANDROID:-}" ]; then
  if [ "$REQUIRE_ANDROID_REVENUECAT" = "1" ]; then
    echo "ERROR: VITE_REVENUECAT_API_KEY_ANDROID not set — Android IAP will fail Play review."
    echo "Add goog_… key from RevenueCat to Codemagic group 'frigy' (see docs/STORE_BILLING_SETUP.md)."
    exit 1
  fi
  echo "WARNING: VITE_REVENUECAT_API_KEY_ANDROID not set — build continues; Play IAP disabled until key is added."
else
  echo "VITE_REVENUECAT_API_KEY_ANDROID present."
fi

# Android release must be signed with upload/release keystore — not debug (Play Console rejects debug AABs).
if [[ "$WORKFLOW" == *android* ]] || [[ "$WORKFLOW" == *Android* ]]; then
  if [ -n "${CM_KEYSTORE_PATH:-}" ] && [ -f "${CM_KEYSTORE_PATH}" ]; then
    echo "Android release keystore present: CM_KEYSTORE_PATH"
  else
    echo "ERROR: Android release keystore not injected (CM_KEYSTORE_PATH missing or file not found)."
    echo "Fix: Codemagic Team settings → Code signing identities → Android keystores"
    echo "     → Upload your Play upload keystore → Reference name: frigy_release"
    echo "     codemagic.yaml must include: android_signing: [frigy_release]"
    echo "     Then start a new Android Build workflow (do not upload old debug-signed AAB)."
    exit 1
  fi
fi

echo "Codemagic env OK (Supabase + signing prerequisites)."
