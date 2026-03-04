#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

BUNDLE_ID="com.waitme.app"

echo "[ios:run] 1. Clean..."
rm -rf dist
rm -rf ios/App/App/public

echo "[ios:run] 2. Build..."
npm run build

echo "[ios:run] 3. Sync iOS..."
npx cap sync ios

echo "[ios:run] 4. Compilar .app..."
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath ./DerivedData build -quiet
cd ../..

APP_PATH="ios/App/DerivedData/Build/Products/Debug-iphonesimulator/App.app"

echo "[ios:run] 5. Buscar simulador (booted primero, sino iPhone 16e/16)..."
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
echo "[ios:run] 6. Boot simulador si hace falta..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true

echo "[ios:run] 7. Instalar y lanzar..."
xcrun simctl uninstall "$DEVICE" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl install "$DEVICE" "$APP_PATH"
xcrun simctl launch "$DEVICE" "$BUNDLE_ID"

echo ""
echo "--- LAUNCHED OK ---"
echo "Bundle ID: $BUNDLE_ID"
echo "Simulador: $DEVICE ($SIM_NAME)"
echo ""
