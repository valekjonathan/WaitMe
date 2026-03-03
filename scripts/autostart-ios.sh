#!/bin/bash
# Espera a que Vite esté listo, luego build+sync+lanza iOS Simulator

WAIT_SECS=8
echo "⏳ Esperando ${WAIT_SECS}s a que el servidor Vite arranque..."
sleep $WAIT_SECS

echo "🔨 Construyendo app..."
npm run build --prefix "$(dirname "$0")/.."

echo "🔄 Sincronizando con Capacitor..."
npx cap sync ios --project-dir "$(dirname "$0")/.."

echo "📱 Abriendo iOS Simulator..."
open -a Simulator

sleep 4

echo "🚀 Lanzando app en Simulator..."
xcrun simctl launch booted com.waitman.app 2>/dev/null \
  && echo "✅ App lanzada" \
  || echo "⚠️  App no instalada aún — ábrela desde Xcode una primera vez y luego esto funcionará solo"
