#!/usr/bin/env bash
# ship-infra.sh — Commit y push SOLO archivos de infraestructura.
# Bloquea si hay cambios en src/, Home.jsx, MapboxMap, ParkingMap, CreateAlertCard.
# Uso: bash scripts/ship-infra.sh [--dry-run]
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DRY_RUN=0
[[ "$1" == "--dry-run" ]] && DRY_RUN=1

# Forbidden paths (cualquier cambio aquí = BLOQUEAR)
FORBIDDEN_PATTERNS=(
  "src/"
  "src/pages/Home.jsx"
  "src/components/MapboxMap.jsx"
  "src/components/map/ParkingMap.jsx"
  "src/components/cards/CreateAlertCard.jsx"
)

# Allowed paths (solo estos se pueden commitear)
ALLOWED_PATHS=(
  "devcontext"
  "docs"
  "PROJECT_GUARDRAILS.md"
  "scripts"
  "automation"
)

echo "[ship-infra] Checking for forbidden modifications..."

# Get list of modified/added files (working tree + staged)
CHANGED=$(git diff --name-only 2>/dev/null; git diff --cached --name-only 2>/dev/null) || true

FORBIDDEN_FOUND=()
for f in $CHANGED; do
  [[ -z "$f" ]] && continue
  if [[ "$f" == src/* ]]; then
    FORBIDDEN_FOUND+=("$f")
  fi
done

if [[ ${#FORBIDDEN_FOUND[@]} -gt 0 ]]; then
  echo ""
  echo "INFRA SHIP BLOCKED"
  echo "Forbidden modified files detected:"
  printf '  - %s\n' "${FORBIDDEN_FOUND[@]}" | sort -u
  echo ""
  echo "Infra ship only allows: devcontext/*, docs/*, PROJECT_GUARDRAILS.md, scripts/*, automation/*"
  echo "Unstage app code or use 'npm run ship' for full project."
  exit 1
fi

# Stage only allowed paths
echo "[ship-infra] Staging allowed paths only..."
git add devcontext/ docs/ PROJECT_GUARDRAILS.md scripts/ automation/ 2>/dev/null || true

# Verify nothing from src/ slipped in
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
for f in $STAGED; do
  if [[ "$f" == src/* ]]; then
    echo "INFRA SHIP BLOCKED: src/ file staged: $f"
    git reset HEAD 2>/dev/null || true
    exit 1
  fi
done

if git diff --staged --quiet 2>/dev/null; then
  echo "[ship-infra] No infrastructure changes to commit"
  exit 0
fi

if [[ $DRY_RUN -eq 1 ]]; then
  echo "[ship-infra] DRY RUN — would commit:"
  git diff --staged --stat
  echo ""
  echo "Run without --dry-run to commit and push."
  exit 0
fi

echo "[ship-infra] Committing..."
git commit -m "chore(infra): update automation, scripts, devcontext, docs" 2>/dev/null || true

echo "[ship-infra] Pushing..."
git push origin main 2>/dev/null || true

echo "[ship-infra] DONE"
