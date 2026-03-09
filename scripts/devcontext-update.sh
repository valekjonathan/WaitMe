#!/usr/bin/env bash
# devcontext-update.sh — Automatización máxima del protocolo contexto vivo.
# Regenera ZIP, screenshots, logs, project-tree, actualiza docs, commit+push.
# Uso: npm run devcontext:update

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
DC="devcontext"
TS="$(date '+%Y-%m-%d %H:%M')"

mkdir -p "$DC"

echo "[devcontext] 1. Regenerando ZIP..."
zip -r "$DC/waitme-live-context.zip" . -x "node_modules/*" -x "dist/*" -x "coverage/*" -x ".git/*" -x "ios/*" -x "*.zip" -x ".env*" 2>/dev/null || true
if [[ -f "$DC/waitme-live-context.zip" ]]; then
  echo "[devcontext] ZIP OK: $DC/waitme-live-context.zip"
else
  echo "[devcontext] ZIP falló, continuando..."
fi

echo "[devcontext] 2. Screenshots (simulador booted)..."
if xcrun simctl io booted screenshot "$DC/latest-simulator.png" 2>/dev/null; then
  echo "[devcontext] latest-simulator.png OK"
else
  echo "[devcontext] Simulador no booted, omitiendo screenshot"
fi
if [[ -f "$DC/latest-simulator-after-login.png" ]]; then
  echo "[devcontext] latest-simulator-after-login.png ya existe (no sobrescribir)"
fi

echo "[devcontext] 3. Auth log (preservar si existe)..."
if [[ ! -f "$DC/latest-auth-log.txt" ]]; then
  cat > "$DC/latest-auth-log.txt" << 'AUTHTPL'
# Auth Log — WaitMe
# Copiar [AUTH FINAL 1-12] desde Xcode/Safari Console tras probar Login Google.
# ---
AUTHTPL
  echo "[devcontext] Creada plantilla latest-auth-log.txt"
fi

echo "[devcontext] 4. iOS refresh log..."
npm run ios:refresh 2>&1 | tee "$DC/latest-ios-refresh-log.txt" || true

echo "[devcontext] 5. Project tree..."
bash scripts/gen-project-tree.sh 2>/dev/null || true

echo "[devcontext] 6. Actualizando docs (timestamp)..."
for f in docs/CURSOR_LAST_RESPONSE.md docs/DEV_STATUS.md docs/AUTH_STATUS.md docs/IOS_RUNTIME_STATUS.md docs/HOME_STATUS.md docs/MAP_STATUS.md docs/LIVE_CONTEXT_SUMMARY.md; do
  if [[ -f "$f" ]]; then
    sed -i.bak "s/\*\*Última actualización:\*\*.*/\*\*Última actualización:\*\* $TS/" "$f" 2>/dev/null || true
    rm -f "${f}.bak" 2>/dev/null || true
  fi
done

echo "[devcontext] 7. Git add, commit, push..."
git add docs "$DC" 2>/dev/null || true
if git diff --staged --quiet 2>/dev/null; then
  echo "[devcontext] Sin cambios que commitear"
else
  git commit -m "devcontext update" 2>/dev/null || true
  git push origin main 2>/dev/null || true
  echo "[devcontext] Commit y push OK"
fi

echo "[devcontext] DONE — $TS"
