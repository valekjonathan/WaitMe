#!/usr/bin/env bash
# Aplica migraciones de Supabase al proyecto remoto.
# Requiere: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
# Obtener: https://supabase.com/dashboard/account/tokens (token)
#          Project Settings → General (ref)
#          Project Settings → Database (password)

set -e
cd "$(dirname "$0")/.."

# Cargar .env si existe (para VITE_SUPABASE_URL)
if [ -f .env ]; then
  set -a
  source .env 2>/dev/null || true
  set +a
fi

# Project ref: desde env o extraer de VITE_SUPABASE_URL
REF="${SUPABASE_PROJECT_REF:-}"
if [ -z "$REF" ] && [ -n "$VITE_SUPABASE_URL" ]; then
  REF=$(echo "$VITE_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
fi

TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
PASS="${SUPABASE_DB_PASSWORD:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN no configurado."
  echo "  Obtener en: https://supabase.com/dashboard/account/tokens"
  echo "  Ejecutar: export SUPABASE_ACCESS_TOKEN=tu_token"
  exit 1
fi

if [ -z "$REF" ]; then
  echo "Error: SUPABASE_PROJECT_REF no configurado."
  echo "  Obtener en: Project Settings → General (Reference ID)"
  echo "  O configurar VITE_SUPABASE_URL en .env"
  exit 1
fi

if [ -z "$PASS" ]; then
  echo "Error: SUPABASE_DB_PASSWORD no configurado."
  echo "  Obtener en: Project Settings → Database"
  echo "  Ejecutar: export SUPABASE_DB_PASSWORD=tu_password"
  exit 1
fi

echo "Enlazando proyecto $REF..."
npx supabase link --project-ref "$REF" --password "$PASS" --yes

echo "Aplicando migraciones..."
npx supabase db push --password "$PASS"

echo "Migraciones aplicadas correctamente."
