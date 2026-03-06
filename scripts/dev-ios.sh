#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

IP=$(node scripts/get-ip.js)
echo "[dev:ios] IP local: $IP"
echo "[dev:ios] Servidor: http://${IP}:5173"
echo "[dev:ios] Web: http://localhost:5173"
echo ""

export CAPACITOR_USE_DEV_SERVER=true
export CAPACITOR_DEV_SERVER_URL="http://${IP}:5173"

exec npx concurrently "vite --host --port 5173" "npx cap run ios --live-reload --host ${IP} --port 5173"
