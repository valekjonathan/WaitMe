#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

BUNDLE_ID="com.waitme.app"
LOG_FILE="ios_run_last.log"

echo "[ios:run] 1. Clean..."
rm -rf dist
rm -rf ios/App/App/public

echo "[ios:run] 2. Build..."
npm run build

echo "[ios:run] 2b. Validar dist..."
if [ ! -f "dist/index.html" ]; then
  echo "[ios:run] ERROR: dist/index.html no existe"
  exit 1
fi
DIST_ENTRY=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -z "$DIST_ENTRY" ]; then
  echo "[ios:run] ERROR: No existe dist/assets/index-*.js"
  exit 1
fi
echo "[ios:run]   dist/index.html OK, dist/assets/index-*.js OK"

echo "[ios:run] 3. Sync iOS..."
npx cap sync ios

echo "[ios:run] 4. Validar bundle iOS..."
if [ ! -f "ios/App/App/public/index.html" ]; then
  echo "[ios:run] ERROR: ios/App/App/public/index.html no existe"
  exit 1
fi
IOS_ENTRY=$(find ios/App/App/public/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -z "$IOS_ENTRY" ]; then
  echo "[ios:run] ERROR: No existe ios/App/App/public/assets/index-*.js"
  exit 1
fi
echo "[ios:run]   ios/App/App/public OK (index.html + assets/index-*.js)"

echo "[ios:run] 5. Compilar .app..."
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath ./DerivedData build -quiet
cd ../..

APP_PATH="ios/App/DerivedData/Build/Products/Debug-iphonesimulator/App.app"

echo "[ios:run] 6. Buscar simulador (booted primero, sino iPhone 16e/16)..."
DEVICE=$(xcrun simctl list devices | grep "Booted" | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep -E "iPhone 16e|iPhone 16 |iPhone 17" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi

if [ -z "$DEVICE" ]; then
  echo "[ios:run] ERROR: No se encontró simulador."
  exit 1
fi

SIM_NAME=$(xcrun simctl list devices | grep "$DEVICE" | head -1 | xargs)
echo "[ios:run] 7. Boot simulador si hace falta..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true

echo "[ios:run] 8. Desinstalar app anterior..."
xcrun simctl uninstall "$DEVICE" "$BUNDLE_ID" 2>/dev/null || true

echo "[ios:run] 9. Instalar y lanzar..."
xcrun simctl install "$DEVICE" "$APP_PATH"
xcrun simctl launch "$DEVICE" "$BUNDLE_ID"

echo ""
echo "--- LAUNCHED OK ---"
echo "Bundle ID: $BUNDLE_ID"
echo "Simulador: $SIM_NAME"
echo ""

echo "[ios:run] 10. Capturando logs 12 segundos..."
log stream --style compact 2>&1 > "$LOG_FILE" &
LOGPID=$!
sleep 12
kill $LOGPID 2>/dev/null || true
if [ ! -s "$LOG_FILE" ]; then
  echo "NO LOGS CAPTURED" > "$LOG_FILE"
fi

echo ""
echo "--- TOP ERRORS ---"
if [ -f "$LOG_FILE" ]; then
  grep -iE "error|exception|failed|webkit|capacitor|chunk|module|router|auth" "$LOG_FILE" 2>/dev/null | head -40 || echo "(ninguna línea con error/exception/failed/webkit/capacitor/chunk/module/router/auth)"
else
  echo "NO LOGS CAPTURED"
fi
echo ""
echo "--- LAST 80 LINES ---"
if [ -f "$LOG_FILE" ]; then
  tail -80 "$LOG_FILE"
else
  echo "NO LOGS CAPTURED"
fi
echo ""
echo "Log completo guardado en: $LOG_FILE"
