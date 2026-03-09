#!/bin/bash
# ios:refresh — Cierra app, desinstala, recompila, reinstala y abre en Simulador.
# Garantiza que el simulador SIEMPRE muestre la última build real.
set -e
cd "$(dirname "$0")/.."

APP_ID="com.waitme.app"

# Resolver target: iPhone 16e si existe, sino el primer iPhone booted
TARGET=$(xcrun simctl list devices available | grep -E "iPhone 16e.*Booted" | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
if [ -z "$TARGET" ]; then
  TARGET=$(xcrun simctl list devices available | grep -E "iPhone 16e" | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi
if [ -z "$TARGET" ]; then
  TARGET="booted"
fi

echo "[ios:refresh] $(date '+%Y-%m-%d %H:%M:%S') — Iniciando reinstalación completa (target: $TARGET)"
echo ""

echo "[ios:refresh] terminating old app..."
xcrun simctl terminate booted $APP_ID 2>/dev/null || true
echo "[ios:refresh] terminated old app"
echo ""

echo "[ios:refresh] uninstalling old app..."
xcrun simctl uninstall booted $APP_ID 2>/dev/null || true
echo "[ios:refresh] uninstalled old app"
echo ""

echo "[ios:refresh] cleaning dist..."
rm -rf dist
echo "[ios:refresh] dist removed"
echo ""

echo "[ios:refresh] building web..."
VITE_IOS_DEV_BUILD=1 npm run build
echo "[ios:refresh] built web"
echo ""

echo "[ios:refresh] syncing ios..."
npx cap sync ios
echo "[ios:refresh] synced ios"
echo ""

echo "[ios:refresh] installing and launching fresh app..."
if [ "$TARGET" = "booted" ]; then
  npx cap run ios
else
  npx cap run ios --target="$TARGET"
fi
echo "[ios:refresh] launched fresh app"
echo ""

echo "[ios:refresh] ensuring app is launched..."
xcrun simctl launch booted $APP_ID 2>/dev/null || true
echo ""

echo "=========================================="
echo "[ios:refresh] $(date '+%Y-%m-%d %H:%M:%S')"
echo "[ios:refresh] DONE — fresh build installed and launched"
echo "=========================================="
