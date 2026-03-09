#!/bin/bash
# ios:refresh — Cierra app, desinstala, recompila, reinstala y abre en Simulador.
set -e
cd "$(dirname "$0")/.."

APP_ID="com.waitme.app"

echo "Cerrando app..."
xcrun simctl terminate booted $APP_ID 2>/dev/null || true

echo "Desinstalando app..."
xcrun simctl uninstall booted $APP_ID 2>/dev/null || true

echo "Limpiando build..."
rm -rf dist

echo "Build web..."
npm run build

echo "Sync capacitor..."
npx cap sync ios

echo "Instalando app..."
npx cap run ios --target="iPhone 16e"
