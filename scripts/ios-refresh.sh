#!/bin/bash
# ios:refresh — Cierra app, desinstala, recompila, reinstala y abre en Simulador.
# Garantiza que el simulador SIEMPRE muestre la última build.
set -e
cd "$(dirname "$0")/.."

APP_ID="com.waitme.app"

echo "Cerrando app en simulador..."
xcrun simctl terminate booted $APP_ID 2>/dev/null || true

echo "Desinstalando app..."
xcrun simctl uninstall booted $APP_ID 2>/dev/null || true

echo "Limpiando build..."
rm -rf dist

echo "Recompilando web..."
npm run build

echo "Sincronizando capacitor..."
npx cap sync ios

echo "Instalando app nueva..."
npx cap run ios --target="iPhone 16e"
