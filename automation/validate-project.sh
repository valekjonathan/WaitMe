#!/usr/bin/env bash
# validate-project.sh — Ejecuta lint, typecheck y build.
# Exit 0 si todo OK, 1 si falla alguno.
# Output: LINT_STATUS=, TYPECHECK_STATUS=, BUILD_STATUS= (para rebuild-context)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LINT_STATUS="unknown"
TYPECHECK_STATUS="unknown"
BUILD_STATUS="unknown"

echo "[validate-project] Running lint..."
if npm run lint 2>/dev/null; then
  LINT_STATUS="ok"
else
  LINT_STATUS="failed"
fi

echo "[validate-project] Running typecheck..."
if npm run typecheck 2>/dev/null; then
  TYPECHECK_STATUS="ok"
else
  TYPECHECK_STATUS="failed"
fi

echo "[validate-project] Running build..."
if npm run build 2>/dev/null; then
  BUILD_STATUS="ok"
else
  BUILD_STATUS="failed"
fi

# Output for rebuild-context to consume (sourced by caller)
echo "LINT_STATUS=$LINT_STATUS"
echo "TYPECHECK_STATUS=$TYPECHECK_STATUS"
echo "BUILD_STATUS=$BUILD_STATUS"

if [[ "$LINT_STATUS" != "ok" ]] || [[ "$TYPECHECK_STATUS" != "ok" ]] || [[ "$BUILD_STATUS" != "ok" ]]; then
  exit 1
fi
exit 0
