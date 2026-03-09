#!/usr/bin/env bash
# ios:watch — Vigila src/, reconstruye y sincroniza al cambiar código.
# Requiere: app ya instalada (ej. tras npm run ios:fresh). Refresca reiniciando la app.
set -e
cd "$(dirname "$0")/.."

echo "[ios:watch] Vigilando src/ — build + sync + restart al cambiar..."
echo "[ios:watch] Ctrl+C para salir."
echo ""

npx chokidar "src/**/*" -c "bash scripts/ios-rebuild-and-sync.sh"
