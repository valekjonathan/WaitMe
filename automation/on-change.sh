#!/usr/bin/env bash
# Ejecutar tras cambio relevante: devcontext update + push + ping bridge
# Usar en Cursor hooks: "command": "bash automation/on-change.sh"
set -e
cd "$(dirname "$0")/.."
npm run devcontext:update
if [[ -n "$BRIDGE_URL" ]]; then
  curl -s -X POST "$BRIDGE_URL/ping" -H "Content-Type: application/json" \
    -d "{\"repo\":\"valekjonathan/WaitMe\",\"status\":\"updated\"}" 2>/dev/null || true
fi
