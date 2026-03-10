#!/usr/bin/env bash
# detect-change.sh — Detecta modificaciones en el repositorio.
# Exit 0 si hay cambios, 1 si no hay cambios.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[detect-change] Repo has uncommitted changes"
  exit 0
fi

# Check if HEAD differs from remote (optional: detect pushes)
if git fetch origin 2>/dev/null; then
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main 2>/dev/null)" ]]; then
    echo "[detect-change] Local differs from origin/main"
    exit 0
  fi
fi

echo "[detect-change] No changes detected"
exit 1
