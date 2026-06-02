#!/usr/bin/env bash
set -euo pipefail

url="${SUPABASE_URL:-${EXPO_PUBLIC_SUPABASE_URL:-}}"
key="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$url" ] || [ -z "$key" ]; then
  echo "::error::Supabase repository secrets are missing or empty."
  echo "Add at: https://github.com/${GITHUB_REPOSITORY}/settings/secrets/actions"
  echo "Required: SUPABASE_SERVICE_ROLE_KEY and (SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL)."
  exit 1
fi

printf 'SUPABASE_URL=%s\nSUPABASE_SERVICE_ROLE_KEY=%s\n' "$url" "$key" > .env
echo "Supabase credentials loaded (url length: ${#url}, key length: ${#key})."
