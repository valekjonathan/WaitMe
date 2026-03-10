#!/usr/bin/env bash
# project-snapshot.sh — Genera snapshot ZIP reproducible del contexto del proyecto.
# Output: tmp/waitme-snapshot.zip
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p tmp

SNAPSHOT="tmp/waitme-snapshot.zip"
DC="devcontext"

bash scripts/gen-project-tree.sh 2>/dev/null || true

rm -f "$SNAPSHOT" 2>/dev/null || true
zip -r "$SNAPSHOT" docs/ devcontext/ automation/ scripts/ package.json capacitor.config.ts vite.config.js tsconfig.json \
  -x "*.zip" -x "*.log" -x ".env*" -x "node_modules/*" -x "dist/*" -x "coverage/*" -x ".git/*" \
  -x "ios/DerivedData/*" -x "ios/App/build/*" -x "*.xcuserdata*" \
  -x "devcontext/.validate_out" -x "devcontext/.cursor_summary_tmp" 2>/dev/null || true

if [[ -f ios/App/App/capacitor.config.json ]]; then
  zip -u "$SNAPSHOT" ios/App/App/capacitor.config.json 2>/dev/null || true
fi

if [[ -f "$SNAPSHOT" ]]; then
  echo "[project-snapshot] OK: $SNAPSHOT ($(du -h "$SNAPSHOT" | cut -f1))"
  exit 0
else
  echo "[project-snapshot] FAIL: could not create $SNAPSHOT"
  exit 1
fi
