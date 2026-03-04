#!/usr/bin/env bash
# Lint, fix, check, then commit and push.
# Usage: npm run ship

set -e

cd "$(dirname "$0")/.."

echo "=== Lint (with auto-fix) ==="
npm run lint:fix

echo ""
echo "=== Build check ==="
npm run build

echo ""
echo "=== Staging changes ==="
git add .
if ! git diff --staged --quiet 2>/dev/null; then
  echo "Committing (post-commit will push)..."
  git commit -m "chore: auto-update"
  echo "Done."
else
  echo "No changes to commit."
fi
