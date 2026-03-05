#!/usr/bin/env bash
# Guardrail anti-destrucción: bloquea migraciones con SQL peligroso en producción.
# Falla si encuentra DROP TABLE, TRUNCATE, DROP SCHEMA o DELETE FROM (sin documentación SAFE).
set -euo pipefail

MIGRATIONS_DIR="${1:-supabase/migrations}"
FAILED=0

check_pattern() {
  local pattern="$1"
  local desc="$2"
  local files
  # Excluir líneas que son solo comentarios (empiezan con --)
  files=$(grep -rln -E "$pattern" "$MIGRATIONS_DIR" 2>/dev/null || true)
  if [[ -n "$files" ]]; then
    local found=""
    while read -r f; do
      matches=$(grep -n -E "$pattern" "$f" 2>/dev/null | while read -r line; do
        content="${line#*:}"
        [[ "$content" =~ ^[[:space:]]*-- ]] && continue
        echo "$line"
      done)
      if [[ -n "$matches" ]]; then
        found="$found"$'\n'"  - $f:"$'\n'"$matches"
        FAILED=1
      fi
    done <<< "$files"
    if [[ -n "$found" ]]; then
      echo "::error::Migraciones peligrosas detectadas ($desc):$found"
    fi
  fi
}

# DELETE FROM: permitir solo si tiene comentario "SAFE: ..." en la misma migración
check_delete() {
  local files
  files=$(grep -rln -E '\bDELETE\s+FROM\b' "$MIGRATIONS_DIR" 2>/dev/null || true)
  if [[ -n "$files" ]]; then
    while read -r f; do
      if grep -q '\bDELETE\s+FROM\b' "$f"; then
        if ! grep -q 'SAFE:\s*' "$f"; then
          echo "::error::DELETE FROM sin documentación SAFE en: $f"
          FAILED=1
        fi
      fi
    done <<< "$files"
  fi
}

echo "Verificando seguridad de migraciones en $MIGRATIONS_DIR..."

check_pattern '\bDROP\s+TABLE\b' "DROP TABLE"
check_pattern '\bTRUNCATE\b' "TRUNCATE"
check_pattern '\bDROP\s+SCHEMA\b' "DROP SCHEMA"
check_delete

if [[ $FAILED -eq 1 ]]; then
  echo "::error::Bloqueado: migraciones con SQL destructivo detectado."
  exit 1
fi

echo "OK: migraciones pasan el guardrail de seguridad."
