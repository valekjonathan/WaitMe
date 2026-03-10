#!/usr/bin/env bash
# project-health.sh — Verifica salud de la capa de infraestructura.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
FAIL=0

echo "PROJECT HEALTH CHECK"

if npm run lint 2>/dev/null; then echo "lint: OK"; else echo "lint: FAIL"; FAIL=1; fi
if npm run typecheck 2>/dev/null; then echo "typecheck: OK"; else echo "typecheck: FAIL"; FAIL=1; fi
if npm run build 2>/dev/null; then echo "build: OK"; else echo "build: FAIL"; FAIL=1; fi

if [[ -f devcontext/STATE_OF_TRUTH.json ]] && node -e "JSON.parse(require('fs').readFileSync('devcontext/STATE_OF_TRUTH.json','utf8'))" 2>/dev/null; then
  echo "state_of_truth: OK"
else
  echo "state_of_truth: FAIL"
  FAIL=1
fi

if [[ -f devcontext/NEXT_TASK.md ]]; then echo "next_task: OK"; else echo "next_task: FAIL"; FAIL=1; fi

AUTOMATION_OK=1
for s in automation/validate-project.sh automation/rebuild-context.sh automation/publish-devcontext.sh automation/on-change.sh; do
  if [[ ! -f "$s" ]] || [[ ! -x "$s" ]]; then AUTOMATION_OK=0; break; fi
done
if [[ $AUTOMATION_OK -eq 1 ]]; then echo "automation: OK"; else echo "automation: FAIL"; FAIL=1; fi

if bash scripts/project-snapshot.sh 2>/dev/null && [[ -f tmp/waitme-snapshot.zip ]]; then
  echo "snapshot: OK"
else
  echo "snapshot: FAIL"
  FAIL=1
fi

if [[ -f PROJECT_GUARDRAILS.md ]]; then echo "guardrails: OK"; else echo "guardrails: FAIL"; FAIL=1; fi

DOCS_OK=1
for d in docs/DEV_STATUS.md docs/CURSOR_LAST_RESPONSE.md docs/AUTOMATION_ARCHITECTURE.md; do
  if [[ ! -f "$d" ]]; then DOCS_OK=0; break; fi
done
if [[ $DOCS_OK -eq 1 ]]; then echo "docs: OK"; else echo "docs: FAIL"; FAIL=1; fi

exit $FAIL
