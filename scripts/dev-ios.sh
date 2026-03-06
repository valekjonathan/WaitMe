#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

PORT=5173

# 1. Comprobar que el puerto está libre
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "[dev:ios] ERROR: El puerto ${PORT} está ocupado."
  echo "[dev:ios] Cierra el proceso que lo usa o ejecuta: lsof -i :${PORT}"
  exit 1
fi

# 2. Obtener IP (get-ip.js hace exit 1 si no hay IP válida)
IP=$(node scripts/get-ip.js)
URL="http://${IP}:${PORT}"

echo ""
echo "=========================================="
echo "  WaitMe — dev:ios"
echo "=========================================="
echo "  IP detectada:    $IP"
echo "  Puerto:         $PORT"
echo "  URL iPhone:     $URL"
echo "  Web local:      http://localhost:${PORT}"
echo "=========================================="
echo ""
echo "[dev:ios] El iPhone DEBE abrir esta URL: $URL"
echo "[dev:ios] Comprueba: iPhone y Mac en la misma WiFi; permiso 'Red local' en iPhone."
echo ""

export CAPACITOR_USE_DEV_SERVER=true
export CAPACITOR_DEV_SERVER_URL="$URL"

# 3. Asegurar que dist existe (cap copy lo requiere)
if [ ! -d dist ]; then
  echo "[dev:ios] dist/ no existe. Ejecutando build inicial..."
  npm run build
fi

# 4. Sincronizar config a iOS (embebe server.url en el proyecto nativo)
npx cap copy ios

# 5. Arrancar Vite y Capacitor con live reload
exec npx concurrently "vite --host --port ${PORT}" "npx cap run ios --live-reload --host ${IP} --port ${PORT}"
