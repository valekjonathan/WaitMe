#!/usr/bin/env bash
# ios:fresh — Elimina app anterior, limpia build, sincroniza Capacitor, reconstruye e instala en Simulator.
# SIEMPRE usa build empaquetada local. NUNCA depende de localhost/servidor dev.
set -e
cd "$(dirname "$0")/.."

# Crítico: asegurar que NO haya server.url en config (evita pantalla blanca)
unset CAP_LIVE_RELOAD
unset CAPACITOR_USE_DEV_SERVER
unset CAPACITOR_DEV_SERVER_URL

BUNDLE_ID="com.waitme.app"
TARGET_NAME="iPhone 16e"
RUNTIME_CONFIG="ios/App/App/capacitor.config.json"

remove_server_from_config() {
  if [ ! -f "$RUNTIME_CONFIG" ]; then return; fi
  if grep -q '"server"' "$RUNTIME_CONFIG" 2>/dev/null; then
    node -e "
      const fs = require('fs');
      const p = process.env.RUNTIME_CONFIG;
      let c = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (c.server) { delete c.server; fs.writeFileSync(p, JSON.stringify(c, null, '\t')); process.exit(0); }
      process.exit(1);
    "
    echo "[ios:fresh] Removed dev server configuration from runtime config"
  fi
}

verify_no_server() {
  if [ ! -f "$RUNTIME_CONFIG" ]; then return; fi
  if grep -q '"server"' "$RUNTIME_CONFIG" 2>/dev/null; then
    echo "[ios:fresh] ERROR: server.url aún presente en runtime config"
    exit 1
  fi
  echo "[ios:fresh] Server URL in runtime config: NONE"
}

echo "[ios:fresh] 1. Resolver simulador $TARGET_NAME..."
DEVICE=$(xcrun simctl list devices available | grep -E "iPhone 16e" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi
if [ -z "$DEVICE" ]; then
  echo "[ios:fresh] ERROR: No se encontró simulador iPhone."
  exit 1
fi
echo "[ios:fresh]   → $TARGET_NAME ($DEVICE)"

echo "[ios:fresh] 2. Boot simulador (si hace falta)..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true
sleep 1

echo "[ios:fresh] 3. Terminar y desinstalar app anterior..."
xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl uninstall booted "$BUNDLE_ID" 2>/dev/null || true

echo "[ios:fresh] 4. Limpiar build anterior..."
rm -rf dist
rm -rf ios/App/App/public
rm -rf ios/App/DerivedData 2>/dev/null || true

echo "[ios:fresh] 5. Build web..."
npm run build

echo "[ios:fresh] 6. Sync Capacitor (build empaquetada, sin server.url)..."
npx cap sync ios

echo "[ios:fresh] 6b. Forzar limpieza de server.url en runtime config..."
export RUNTIME_CONFIG
remove_server_from_config

echo "[ios:fresh] 6c. Verificación final..."
verify_no_server

echo "[ios:fresh] 7. Compilar, instalar y lanzar en $TARGET_NAME..."
npx cap run ios --target="$DEVICE" --no-sync

echo ""
echo "[ios:fresh] ✓ Listo. WaitMe instalado y ejecutándose en $TARGET_NAME."
