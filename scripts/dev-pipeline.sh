#!/usr/bin/env bash
# dev-pipeline.sh — Pipeline completa de automatización (no-UI).
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=========================================="
echo "WaitMe DEV PIPELINE (infrastructure only)"
echo "=========================================="

echo ""
echo "[1/5] validate-project..."
VALIDATE_OUT="$ROOT/devcontext/.validate_out"
if ! bash automation/validate-project.sh 2>&1 | tee "$VALIDATE_OUT"; then
  echo "PIPELINE FAIL: validate-project"
  exit 1
fi
set -a
eval $(grep -E '^LINT_STATUS=|^TYPECHECK_STATUS=|^BUILD_STATUS=' "$VALIDATE_OUT" 2>/dev/null || true)
set +a
rm -f "$VALIDATE_OUT" 2>/dev/null || true

echo ""
echo "[2/5] rebuild-context..."
if ! bash automation/rebuild-context.sh 2>&1; then
  echo "PIPELINE FAIL: rebuild-context"
  exit 1
fi

echo ""
echo "[3/5] publish-devcontext..."
if ! bash automation/publish-devcontext.sh 2>&1; then
  echo "PIPELINE FAIL: publish-devcontext"
  exit 1
fi

echo ""
echo "[4/5] project-snapshot..."
if ! bash scripts/project-snapshot.sh 2>&1; then
  echo "PIPELINE FAIL: project-snapshot"
  exit 1
fi

echo ""
echo "[5/5] project-health..."
if ! bash scripts/project-health.sh 2>&1; then
  echo "PIPELINE FAIL: project-health"
  exit 1
fi

echo ""
echo "=========================================="
echo "PIPELINE OK"
echo "=========================================="
