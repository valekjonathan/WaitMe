#!/usr/bin/env bash
# on-change.sh — Orquesta la pipeline de automatización devcontext.
# Invocado por Cursor hooks (stop) o manualmente.
# NO hace commit de código de aplicación. Solo devcontext/* y docs/*.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[on-change] WaitMe automation pipeline"

# 0. If CHATGPT_TASK.md changed, run full dev-pipeline first
if [[ -f "$ROOT/devcontext/CHATGPT_TASK.md" ]] && [[ -n "$(git status --porcelain "$ROOT/devcontext/CHATGPT_TASK.md" 2>/dev/null)" ]]; then
  echo "[on-change] CHATGPT_TASK.md changed — running dev-pipeline..."
  bash "$ROOT/scripts/dev-pipeline.sh" 2>&1 || true
fi

# 1. Validate project (lint, typecheck, build)
echo "[on-change] 1. validate-project..."
VALIDATE_OUT="$ROOT/devcontext/.validate_out"
bash "$ROOT/automation/validate-project.sh" 2>&1 | tee "$VALIDATE_OUT" || true
# Source status vars for rebuild-context
set -a
eval $(grep -E '^LINT_STATUS=|^TYPECHECK_STATUS=|^BUILD_STATUS=' "$VALIDATE_OUT" 2>/dev/null || true)
set +a
rm -f "$VALIDATE_OUT" 2>/dev/null || true

# 2. Rebuild context (STATE_OF_TRUTH.json, docs timestamps)
echo "[on-change] 2. rebuild-context..."
bash "$ROOT/automation/rebuild-context.sh"

# 3. Publish devcontext artifacts (ZIP, project-tree, screenshot)
echo "[on-change] 3. publish-devcontext..."
bash "$ROOT/automation/publish-devcontext.sh"

# 4. Git: stage and commit ONLY devcontext/*, docs/*, PROJECT_GUARDRAILS.md (never application code, never src/)
echo "[on-change] 4. Git stage (devcontext + docs + guardrails only)..."
git add devcontext/ docs/ PROJECT_GUARDRAILS.md 2>/dev/null || true

if git diff --staged --quiet 2>/dev/null; then
  echo "[on-change] No changes to commit"
else
  git commit -m "chore(devcontext): update project state" 2>/dev/null || true
  git push origin main 2>/dev/null || true
  echo "[on-change] Commit and push OK"
  # Ping bridge if configured
  if [[ -n "$BRIDGE_URL" ]]; then
    TS=$(date +"%Y-%m-%dT%H:%M:%S")
    curl -s -X POST "$BRIDGE_URL/ping" -H "Content-Type: application/json" \
      -d "{\"repo\":\"valekjonathan/WaitMe\",\"status\":\"devcontext_updated\",\"timestamp\":\"$TS\"}" 2>/dev/null || true
  fi
fi

echo "[on-change] DONE"
