#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "[ios:reset] 1. Backup ios..."
if [ -d ios ]; then
  BACKUP="ios__backup_black_screen__$(date +%Y%m%d_%H%M%S)"
  mv ios "$BACKUP"
  echo "  → Backup en $BACKUP"
fi

echo "[ios:reset] 2. Regenerar iOS..."
npx cap add ios

echo "[ios:reset] 3. Build y sync..."
npm run build
npx cap sync ios

echo "[ios:reset] 4. Compilar .app..."
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath ./DerivedData build -quiet
cd ../..

APP_PATH="ios/App/DerivedData/Build/Products/Debug-iphonesimulator/App.app"

echo "[ios:reset] 5. Buscar simulador iPhone 16e o similar..."
DEVICE=$(xcrun simctl list devices available | grep -E "iPhone 16e|iPhone 16 |iPhone 17" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi

echo "[ios:reset] 6. Boot simulador si hace falta..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true

echo "[ios:reset] 7. Desinstalar app anterior..."
xcrun simctl uninstall "$DEVICE" com.waitme.app 2>/dev/null || true

echo "[ios:reset] 8. Instalar y lanzar..."
xcrun simctl install "$DEVICE" "$APP_PATH"
xcrun simctl launch "$DEVICE" com.waitme.app

echo "[ios:reset] ✓ Listo. App lanzada en simulador."
