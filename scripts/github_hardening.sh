#!/usr/bin/env bash
# github_hardening.sh — Blinda main con branch protection y environment production
# Requiere: gh CLI instalado y autenticado (gh auth login)
set -euo pipefail

if ! command -v gh &>/dev/null; then
  echo "Error: 'gh' (GitHub CLI) no está instalado."
  echo "  Instala: https://cli.github.com/ (brew install gh en macOS)"
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-}"
if [[ -z "$REPO" ]]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi
if [[ -z "$REPO" ]]; then
  # Fallback: extraer de git remote
  REMOTE=$(git remote get-url origin 2>/dev/null || true)
  if [[ "$REMOTE" =~ github\.com[:/]([^/]+/[^/.]+) ]]; then
    REPO="${BASH_REMATCH[1]%.git}"
  fi
fi
if [[ -z "$REPO" ]]; then
  echo "Error: No se pudo detectar el repo. Ejecuta desde un repo git con 'gh auth login'."
  exit 1
fi

BRANCH="${1:-main}"
CI_FILE=".github/workflows/ci.yml"

echo "=== GitHub Hardening ==="
echo "Repo: $REPO"
echo "Branch: $BRANCH"
echo ""

# 1) Extraer status checks del workflow ci.yml
# El check que bloquea merge es el nombre del job. GitHub Actions usa el job name como context.
# Solo job-level "name:" (4 espacios), no step names (6+ espacios)
STATUS_CHECKS=()
if [[ -f "$CI_FILE" ]]; then
  while IFS= read -r line; do
    cleaned=$(echo "$line" | sed 's/^[[:space:]]*name:[[:space:]]*["'\'']*//;s/["'\'']*[[:space:]]*$//')
    [[ -n "$cleaned" ]] && STATUS_CHECKS+=("$cleaned")
  done < <(grep -E '^    name:' "$CI_FILE" | head -20 | sed 's/^[[:space:]]*name:[[:space:]]*//;s/["'\'']//g')
  if [[ ${#STATUS_CHECKS[@]} -eq 0 ]]; then
    workflow_name=$(grep -m1 "^name:" "$CI_FILE" | sed 's/^name:[[:space:]]*//;s/["'\'']//g' | tr -d ' ')
    [[ -n "$workflow_name" ]] && STATUS_CHECKS=("$workflow_name")
  fi
fi
[[ ${#STATUS_CHECKS[@]} -eq 0 ]] && STATUS_CHECKS=("CI")

# Construir array JSON
CONTEXTS_JSON=$(printf '%s\n' "${STATUS_CHECKS[@]}" | jq -R . | jq -s .)
echo "Status checks a requerir: $CONTEXTS_JSON"
echo ""

# 2) Branch protection
echo ">>> Configurando branch protection en $BRANCH..."
PROTECTION_PAYLOAD=$(jq -n \
  --argjson contexts "$CONTEXTS_JSON" \
  '{
    required_status_checks: { strict: true, contexts: $contexts },
    enforce_admins: false,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    required_linear_history: true
  }')

if echo "$PROTECTION_PAYLOAD" | gh api "repos/$REPO/branches/$BRANCH/protection" -X PUT --input - 2>&1; then
  echo "✓ Branch protection aplicada."
else
  echo ":::error::Falló branch protection. ¿Tienes permisos admin? (Settings → Collaborators)"
  exit 1
fi

# 3) Environment production (opcional — a menudo requiere permisos especiales)
echo ""
echo ">>> Intentando configurar environment 'production' con required reviewers..."
CURRENT_USER_ID=$(gh api user -q .id 2>/dev/null || true)
if [[ -n "$CURRENT_USER_ID" ]]; then
  ENV_PAYLOAD=$(jq -n --argjson uid "$CURRENT_USER_ID" '{reviewers: [{type: "User", id: $uid}]}')
  if echo "$ENV_PAYLOAD" | gh api "repos/$REPO/environments/production" -X PUT --input - 2>/dev/null; then
    echo "✓ Environment 'production' creado/actualizado con required reviewers."
  else
    echo "⚠ No se pudo configurar environment por API (permisos o plan)."
    echo "  Sigue docs/ONE_TIME_GITHUB_CLICKS.md para hacerlo manualmente."
  fi
else
  echo "⚠ No se pudo obtener user ID. Sigue docs/ONE_TIME_GITHUB_CLICKS.md."
fi

echo ""
echo "=== Hardening completado ==="
