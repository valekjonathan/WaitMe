#!/bin/bash
# ios:refresh — Cierra app, desinstala, recompila, reinstala y abre en Simulador.
# Garantiza que el simulador SIEMPRE muestre la última build real.
set -e
cd "$(dirname "$0")/.."

APP_ID="com.waitme.app"
TARGET="iPhone 16e"

echo "[ios:refresh] $(date '+%Y-%m-%d %H:%M:%S') — Iniciando reinstalación completa"
echo ""

echo "[1/6] Cerrando app en simulador..."
xcrun simctl terminate booted $APP_ID 2>/dev/null || true
echo "       ✓ App cerrada (o no estaba corriendo)"
echo ""

echo "[2/6] Desinstalando app..."
xcrun simctl uninstall booted $APP_ID 2>/dev/null || true
echo "       ✓ App desinstalada"
echo ""

echo "[3/6] Limpiando build anterior..."
rm -rf dist
echo "       ✓ dist/ eliminado"
echo ""

echo "[4/6] Build web (npm run build)..."
npm run build
echo "       ✓ Build completado"
echo ""

echo "[5/6] Sincronizando Capacitor..."
npx cap sync ios
echo "       ✓ Capacitor sincronizado"
echo ""

echo "[6/6] Instalando y lanzando app en simulador ($TARGET)..."
npx cap run ios --target="$TARGET"
echo ""

echo "=========================================="
echo "  [ios:refresh] $(date '+%Y-%m-%d %H:%M:%S')"
echo "  ✓ Installed fresh build"
echo "  ✓ Bundle: $APP_ID"
echo "  ✓ Ready"
echo "=========================================="
