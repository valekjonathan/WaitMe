#!/usr/bin/env bash
# publish-devcontext.sh — Actualiza artefactos devcontext (ZIP, screenshot, project-tree).
# No hace commit. Solo prepara los artefactos.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
DC="devcontext"

mkdir -p "$DC"

echo "[publish-devcontext] Regenerating ZIP..."
zip -r "$DC/waitme-live-context.zip" . -x "node_modules/*" -x "dist/*" -x "coverage/*" -x ".git/*" -x "ios/*" -x "*.zip" -x ".env*" 2>/dev/null || true
if [[ -f "$DC/waitme-live-context.zip" ]]; then
  echo "[publish-devcontext] ZIP OK: $DC/waitme-live-context.zip"
fi

echo "[publish-devcontext] Project tree..."
bash scripts/gen-project-tree.sh 2>/dev/null || true

echo "[publish-devcontext] Screenshot (if simulator booted)..."
if xcrun simctl io booted screenshot "$DC/latest-simulator.png" 2>/dev/null; then
  echo "[publish-devcontext] latest-simulator.png OK"
fi

# Preserve auth/runtime log templates if missing
if [[ ! -f "$DC/latest-auth-log.txt" ]]; then
  echo "# Auth Log — WaitMe" > "$DC/latest-auth-log.txt"
  echo "# Copiar [AUTH FINAL 1-12] desde Xcode/Safari Console tras probar Login Google." >> "$DC/latest-auth-log.txt"
fi

echo "[publish-devcontext] DONE"
