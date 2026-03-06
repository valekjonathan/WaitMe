#!/usr/bin/env bash
# IOS_DEV_LAUNCHER — Comando único para desarrollo iOS
# - ENVIRONMENT_GUARD
# - detectar IP
# - arrancar Vite
# - cap copy ios
# - abrir Xcode
# - lanzar en iPhone físico (si conectado) o Simulator
set -e
cd "$(dirname "$0")/.."

PORT=5173

# 1. ENVIRONMENT_GUARD
bash scripts/environment-guard.sh || exit 1

# 2. Obtener IP
IP=$(node scripts/get-ip.js)
URL="http://${IP}:${PORT}"

echo ""
echo "=========================================="
echo "  WaitMe — dev:ios"
echo "=========================================="
echo "  IP:      $IP"
echo "  Puerto:  $PORT"
echo "  URL:     $URL"
echo "=========================================="
echo ""
echo "[dev:ios] iPhone debe abrir: $URL"
echo "[dev:ios] Misma WiFi + permiso 'Red local' en iPhone."
echo ""

export CAPACITOR_USE_DEV_SERVER=true
export CAPACITOR_DEV_SERVER_URL="$URL"

# 3. dist existe (cap copy lo requiere)
if [ ! -d dist ]; then
  echo "[dev:ios] dist/ no existe. Build inicial..."
  npm run build
fi

# 4. Sincronizar config a iOS
npx cap copy ios

# 5. Arrancar Vite + Capacitor (live reload)
# cap run ios: lanza en Simulator por defecto; si hay iPhone conectado, Xcode puede usarlo
exec npx concurrently "vite --host --port ${PORT}" "npx cap run ios --live-reload --host ${IP} --port ${PORT}"
