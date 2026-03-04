#!/usr/bin/env bash
# Configure GitHub repository secrets for Supabase migrations
# Requires: gh CLI (https://cli.github.com/) authenticated
# Usage: ./scripts/configure-supabase-secrets.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) is required. Install from https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Error: Run 'gh auth login' first."
  exit 1
fi

echo "=== Supabase GitHub Secrets Configuration ==="
echo ""
echo "You will need:"
echo "  1. SUPABASE_ACCESS_TOKEN - from https://supabase.com/dashboard/account/tokens"
echo "  2. SUPABASE_PROJECT_REF  - from Project Settings → General (e.g. abcdefghij)"
echo "  3. SUPABASE_DB_PASSWORD  - from Project Settings → Database"
echo ""
echo "Tip: Project ref can be extracted from VITE_SUPABASE_URL:"
echo "  https://<PROJECT_REF>.supabase.co"
echo ""

read -sp "SUPABASE_ACCESS_TOKEN: " TOKEN
echo ""
if [[ -z "$TOKEN" ]]; then
  echo "Error: Token cannot be empty."
  exit 1
fi

read -p "SUPABASE_PROJECT_REF: " REF
echo ""
if [[ -z "$REF" ]]; then
  echo "Error: Project ref cannot be empty."
  exit 1
fi

read -sp "SUPABASE_DB_PASSWORD: " DB_PASS
echo ""
if [[ -z "$DB_PASS" ]]; then
  echo "Error: Database password cannot be empty."
  exit 1
fi

echo ""
echo "Setting secrets..."

echo "$TOKEN" | gh secret set SUPABASE_ACCESS_TOKEN
echo "$REF"   | gh secret set SUPABASE_PROJECT_REF
echo "$DB_PASS" | gh secret set SUPABASE_DB_PASSWORD

echo ""
echo "Done. Secrets configured:"
echo "  - SUPABASE_ACCESS_TOKEN"
echo "  - SUPABASE_PROJECT_REF"
echo "  - SUPABASE_DB_PASSWORD"
echo ""
echo "Next: Push a change to supabase/migrations/ or run the workflow manually."
