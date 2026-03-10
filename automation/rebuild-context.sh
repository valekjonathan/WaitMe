#!/usr/bin/env bash
# rebuild-context.sh — Regenera STATE_OF_TRUTH.json, DEV_STATUS.md, LIVE_CONTEXT_SUMMARY.md.
# Consume output de validate-project.sh si se ejecutó antes.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
DC="devcontext"
TS="$(date '+%Y-%m-%dT%H:%M:%S')"

mkdir -p "$DC"

# Ensure project-tree exists (for artifacts)
bash scripts/gen-project-tree.sh 2>/dev/null || true

# Collect state
GIT_BRANCH="$(git branch --show-current 2>/dev/null || echo '')"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo '')"
GIT_DIRTY="false"
[[ -n "$(git status --porcelain 2>/dev/null)" ]] && GIT_DIRTY="true"

NODE_VER="$(node -v 2>/dev/null || echo '')"
NPM_VER="$(npm -v 2>/dev/null || echo '')"
PLATFORM="$(uname -s 2>/dev/null || echo '')"

# Validation status (from validate-project or defaults)
LINT_STATUS="${LINT_STATUS:-unknown}"
TYPECHECK_STATUS="${TYPECHECK_STATUS:-unknown}"
BUILD_STATUS="${BUILD_STATUS:-unknown}"

# Test results (from env or default 0)
TEST_PASSED="${TEST_PASSED:-0}"
TEST_FAILED="${TEST_FAILED:-0}"
TEST_SKIPPED="${TEST_SKIPPED:-0}"

# Cursor section (from CURSOR_LAST_RESPONSE if exists)
CURSOR_SUMMARY_FILE="$DC/.cursor_summary_tmp"
if [[ -f docs/CURSOR_LAST_RESPONSE.md ]]; then
  head -20 docs/CURSOR_LAST_RESPONSE.md | tail -15 | tr '\n' ' ' | cut -c1-200 | tr -d '\0' > "$CURSOR_SUMMARY_FILE" 2>/dev/null || true
fi
[[ ! -f "$CURSOR_SUMMARY_FILE" ]] && touch "$CURSOR_SUMMARY_FILE"

# Artifacts paths
SOT_SNAPSHOT_ZIP=""
[[ -f tmp/waitme-snapshot.zip ]] && SOT_SNAPSHOT_ZIP="tmp/waitme-snapshot.zip"
SOT_PROJECT_TREE="devcontext/project-tree.txt"
SOT_SIMULATOR_IMG=""
[[ -f "$DC/latest-simulator.png" ]] && SOT_SIMULATOR_IMG="devcontext/latest-simulator.png"

# Workflow from NEXT_TASK.md (value on line after key)
SOT_CURRENT_STAGE="infrastructure_stable"
SOT_NEXT_TASK="close_google_login_ios"
if [[ -f "$DC/NEXT_TASK.md" ]]; then
  SOT_CURRENT_STAGE=$(awk '/^CURRENT_STAGE:/{getline; print; exit}' "$DC/NEXT_TASK.md" 2>/dev/null | tr -d ' \r' || echo "$SOT_CURRENT_STAGE")
  SOT_NEXT_TASK=$(awk '/^NEXT_TASK:/{getline; print; exit}' "$DC/NEXT_TASK.md" 2>/dev/null | tr -d ' \r' || echo "$SOT_NEXT_TASK")
fi

# Update NEXT_TASK.md LAST_UPDATE
if [[ -f "$DC/NEXT_TASK.md" ]]; then
  sed -i.bak "s/^LAST_UPDATE:.*/LAST_UPDATE: $TS/" "$DC/NEXT_TASK.md" 2>/dev/null || true
  rm -f "$DC/NEXT_TASK.md.bak" 2>/dev/null || true
fi

# Build STATE_OF_TRUTH.json via Node for proper JSON escaping
export SOT_TS="$TS" SOT_BRANCH="$GIT_BRANCH" SOT_COMMIT="$GIT_COMMIT" SOT_DIRTY="$GIT_DIRTY"
export SOT_NODE="$NODE_VER" SOT_NPM="$NPM_VER" SOT_PLATFORM="$PLATFORM"
export SOT_BUILD="$BUILD_STATUS" SOT_LINT="$LINT_STATUS" SOT_TYPECHECK="$TYPECHECK_STATUS"
export SOT_PASSED="$TEST_PASSED" SOT_FAILED="$TEST_FAILED" SOT_SKIPPED="$TEST_SKIPPED"
export SOT_BRIDGE="${BRIDGE_URL:-}" SOT_SUMMARY_FILE="$ROOT/$CURSOR_SUMMARY_FILE" SOT_OUTPUT="$ROOT/$DC/STATE_OF_TRUTH.json"
export SOT_SNAPSHOT_ZIP SOT_PROJECT_TREE SOT_SIMULATOR_IMG SOT_CURRENT_STAGE SOT_NEXT_TASK
node -e "
const fs = require('fs');
const obj = {
  project: 'waitme',
  timestamp: process.env.SOT_TS,
  git: { branch: process.env.SOT_BRANCH, commit: process.env.SOT_COMMIT, dirty: process.env.SOT_DIRTY === 'true' },
  environment: { node: process.env.SOT_NODE, npm: process.env.SOT_NPM, platform: process.env.SOT_PLATFORM },
  build: { status: process.env.SOT_BUILD, last_run: process.env.SOT_TS },
  lint: { status: process.env.SOT_LINT },
  typecheck: { status: process.env.SOT_TYPECHECK },
  tests: { passed: parseInt(process.env.SOT_PASSED||0,10), failed: parseInt(process.env.SOT_FAILED||0,10), skipped: parseInt(process.env.SOT_SKIPPED||0,10) },
  ios_runtime: { mode: 'local_bundle', server_url: 'NONE', simulator_status: '', last_screen: '' },
  automation: { bridge: process.env.SOT_BRIDGE||'', webhook: '', devcontext_updated: process.env.SOT_TS },
  cursor: { last_summary: (()=>{try{return require('fs').readFileSync(process.env.SOT_SUMMARY_FILE,'utf8').slice(0,200);}catch(e){return '';}})(), last_files_modified: [] },
  project_rules: { blocked_areas: ['map','ui','payments','Home.jsx'] },
  artifacts: {
    snapshot_zip: process.env.SOT_SNAPSHOT_ZIP || '',
    project_tree: process.env.SOT_PROJECT_TREE || 'devcontext/project-tree.txt',
    latest_simulator_image: process.env.SOT_SIMULATOR_IMG || ''
  },
  workflow: {
    current_stage: process.env.SOT_CURRENT_STAGE || 'infrastructure_stable',
    next_task: process.env.SOT_NEXT_TASK || 'close_google_login_ios'
  }
};
fs.writeFileSync(process.env.SOT_OUTPUT || 'devcontext/STATE_OF_TRUTH.json', JSON.stringify(obj, null, 2));
"

echo "[rebuild-context] STATE_OF_TRUTH.json regenerated"
rm -f "$CURSOR_SUMMARY_FILE" 2>/dev/null || true

# Update DEV_STATUS.md timestamp
for f in docs/DEV_STATUS.md docs/LIVE_CONTEXT_SUMMARY.md docs/IOS_RUNTIME_STATUS.md docs/CURSOR_LAST_RESPONSE.md; do
  if [[ -f "$f" ]]; then
    sed -i.bak "s/\*\*Última actualización:\*\*.*/\*\*Última actualización:\*\* $(date '+%Y-%m-%d %H:%M')/" "$f" 2>/dev/null || true
    rm -f "${f}.bak" 2>/dev/null || true
  fi
done

echo "[rebuild-context] Docs timestamps updated"
