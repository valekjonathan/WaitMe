#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "[ios:run] 1. Build..."
npm run build

echo "[ios:run] 2. Sync iOS..."
npx cap sync ios

echo "[ios:run] 3. Compilar .app..."
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath ./DerivedData build -quiet
cd ../..

APP_PATH="ios/App/DerivedData/Build/Products/Debug-iphonesimulator/App.app"

echo "[ios:run] 4. Buscar simulador (booted primero, sino iPhone 16/16e)..."
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

echo "[ios:run] 5. Boot simulador si hace falta..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true

echo "[ios:run] 6. Instalar y lanzar..."
xcrun simctl uninstall "$DEVICE" com.waitme.app 2>/dev/null || true
xcrun simctl install "$DEVICE" "$APP_PATH"
xcrun simctl launch "$DEVICE" com.waitme.app

echo "[ios:run] ✓ Listo. App lanzada en simulador."
