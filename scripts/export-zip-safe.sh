#!/usr/bin/env bash
# Export ZIP seguro — EXCLUYE SIEMPRE secretos y archivos sensibles.
# Uso: ./scripts/export-zip-safe.sh [nombre-salida]
# Por defecto: tmp/waitme-export-safe.zip

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-tmp/waitme-export-safe.zip}"
mkdir -p "$(dirname "$OUT")"

cd "$ROOT"
zip -r "$OUT" . \
  -x "node_modules/*" \
  -x "dist/*" \
  -x "coverage/*" \
  -x "playwright-report/*" \
  -x "test-results/*" \
  -x ".git/*" \
  -x "ios/App/App/public/assets/*" \
  -x ".env" \
  -x ".env.local" \
  -x ".env.development" \
  -x ".env.production" \
  -x ".env*" \
  -x "*.zip"

echo "[export-zip-safe] Creado: $OUT"
echo "[export-zip-safe] Verificación:"
unzip -l "$OUT" 2>/dev/null | grep -E "\.env|ios/App/App/public/assets" && echo "!! ALERTA: archivos sensibles incluidos !!" || echo "OK: sin .env ni ios/App/App/public/assets"
