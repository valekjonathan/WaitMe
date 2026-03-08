#!/usr/bin/env bash
# Cierra procesos de tests huérfanos (Playwright, Vitest, chrome-headless-shell).
# Uso: ./scripts/test-cleanup.sh
# Ejecutar después de tests colgados o antes de desarrollo limpio.

set -e
echo "[test-cleanup] Cerrando procesos de tests..."

# chrome-headless-shell (Playwright Chromium)
pkill -f "chrome-headless-shell" 2>/dev/null || true

# Playwright
pkill -f "playwright" 2>/dev/null || true

# Vitest
pkill -f "vitest" 2>/dev/null || true

# Node con playwright en la línea de comando
pkill -f "node.*@playwright/test" 2>/dev/null || true

echo "[test-cleanup] Listo."
