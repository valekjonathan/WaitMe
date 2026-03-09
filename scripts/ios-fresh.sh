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

echo "[ios:fresh] 7. Compilar, instalar y lanzar en $TARGET_NAME..."
npx cap run ios --target="$DEVICE"

echo ""
echo "[ios:fresh] ✓ Listo. WaitMe instalado y ejecutándose en $TARGET_NAME."
