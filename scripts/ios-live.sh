#!/usr/bin/env bash
# ios:live — Dev server + Capacitor live reload. La app recarga al cambiar código.
set -e
cd "$(dirname "$0")/.."

BUNDLE_ID="com.waitme.app"
TARGET_NAME="iPhone 16e"
PORT=5173

echo "[ios:live] 1. Resolver simulador $TARGET_NAME..."
DEVICE=$(xcrun simctl list devices available | grep -E "iPhone 16e" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi
if [ -z "$DEVICE" ]; then
  echo "[ios:live] ERROR: No se encontró simulador iPhone."
  exit 1
fi

echo "[ios:live] 2. Boot simulador (si hace falta)..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true
sleep 1

echo "[ios:live] 3. Iniciar Vite dev server en puerto $PORT..."
npm run dev &
DEVPID=$!
trap "kill $DEVPID 2>/dev/null || true; exit" EXIT INT TERM

echo "[ios:live] 4. Esperando servidor..."
for i in $(seq 1 30); do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then break; fi
  sleep 0.5
done
if ! curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
  echo "[ios:live] ERROR: Dev server no respondió en $PORT"
  exit 1
fi

echo "[ios:live] 5. Sync Capacitor..."
npx cap sync ios

echo "[ios:live] 6. Lanzar app con live reload en $TARGET_NAME..."
npx cap run ios --live-reload --port "$PORT" --target="$DEVICE"

echo "[ios:live] 7. Manteniendo dev server activo (Ctrl+C para salir)..."
wait $DEVPID
