#!/usr/bin/env bash
# Validación completa + commit + push manual.
# Usage: npm run ship

set -e

cd "$(dirname "$0")/.."

echo "=== Lint ==="
npm run lint

echo ""
echo "=== Typecheck ==="
npm run typecheck

echo ""
echo "=== Build ==="
npm run build

echo ""
echo "=== Staging ==="
git add .

if ! git diff --staged --quiet 2>/dev/null; then
  echo "=== Commit + Push ==="
  git commit -m "auto-update"
  git push origin main
  echo "Done."
else
  echo "No changes to commit."
fi
