#!/usr/bin/env bash
# ENVIRONMENT_GUARD — Verifica entorno antes de arrancar dev
# - puerto 5173 libre
# - IP local válida
# - Vite escuchando en 0.0.0.0 (vite.config.js server.host: true)
# - carpeta dist existe (para cap copy)
set -e
cd "$(dirname "$0")/.."

PORT=5173
ERRORS=0

echo "[ENV_GUARD] Verificando entorno..."

# 1. Puerto 5173 libre
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "[ENV_GUARD] ERROR: Puerto ${PORT} ocupado. Cierra el proceso o usa: lsof -i :${PORT}"
  ERRORS=$((ERRORS + 1))
else
  echo "[ENV_GUARD] OK: Puerto ${PORT} libre"
fi

# 2. IP local válida
if IP=$(node scripts/get-ip.js 2>/dev/null); then
  echo "[ENV_GUARD] OK: IP local $IP"
else
  echo "[ENV_GUARD] ERROR: No hay IP local válida. Conecta a WiFi."
  ERRORS=$((ERRORS + 1))
fi

# 3. Vite host (vite.config.js tiene server.host: true)
if grep -q '"host":\s*true' vite.config.js 2>/dev/null || grep -q 'host:\s*true' vite.config.js 2>/dev/null; then
  echo "[ENV_GUARD] OK: Vite configurado para escuchar en 0.0.0.0"
else
  echo "[ENV_GUARD] WARN: Revisa vite.config.js server.host (debe ser true para iOS)"
fi

# 4. Carpeta dist existe
if [ -d dist ]; then
  echo "[ENV_GUARD] OK: dist/ existe"
else
  echo "[ENV_GUARD] WARN: dist/ no existe. Ejecuta 'npm run build' antes de cap copy."
fi

if [ $ERRORS -gt 0 ]; then
  echo "[ENV_GUARD] Fallos: $ERRORS"
  exit 1
fi

echo "[ENV_GUARD] Entorno OK"
