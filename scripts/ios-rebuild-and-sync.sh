#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "[ios:watch] Cambio detectado — build..."
npm run build
echo "[ios:watch] Sync Capacitor..."
npx cap sync ios
echo "[ios:watch] Reiniciando app..."
xcrun simctl terminate booted com.waitme.app 2>/dev/null || true
xcrun simctl launch booted com.waitme.app 2>/dev/null || true
echo "[ios:watch] ✓ Listo."
