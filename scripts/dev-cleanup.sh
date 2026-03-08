#!/usr/bin/env bash
# Limpia procesos basura de desarrollo sin matar dev server ni Simulator.
# Uso: ./scripts/dev-cleanup.sh
# NO mata: vite (dev), Simulator, procesos del sistema.

set -e
echo "[dev-cleanup] Cerrando procesos huérfanos..."

# Chrome/Chromium de Playwright (chrome-headless-shell, etc.)
pkill -f "chrome-headless-shell" 2>/dev/null || true
pkill -f "chromium.*playwright" 2>/dev/null || true

# Playwright
pkill -f "playwright" 2>/dev/null || true

# Vitest browser
pkill -f "vitest.*browser" 2>/dev/null || true

# Node huérfanos de tests (playwright test, vitest run)
# Solo si el comando contiene "test" y no es el dev server
for pid in $(pgrep -f "node.*playwright" 2>/dev/null); do
  kill "$pid" 2>/dev/null || true
done

echo "[dev-cleanup] Listo. Dev server (vite) y Simulator intactos."
