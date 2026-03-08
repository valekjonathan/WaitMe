# Aplicar migración de profiles (fix "Error al guardar")

La migración `20260305120000_fix_profiles_rls_and_trigger.sql` corrige el error al actualizar el perfil de usuario.

## Opción 1: Conexión directa (más rápido)

1. Obtén la **Connection string** en Supabase:
   - Dashboard → **Settings** → **Database**
   - En "Connection string" → **URI** (usa la conexión directa, puerto 5432)
   - Formato: `postgresql://postgres:[YOUR-PASSWORD]@db.acfzelpmvdmeszaqlokd.supabase.co:5432/postgres`

2. Añade a tu `.env` (no subir a git):
   ```
   SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD@db.acfzelpmvdmeszaqlokd.supabase.co:5432/postgres
   ```

3. Ejecuta:
   ```bash
   npm run supabase:migrate:direct
   ```

## Opción 2: Supabase CLI

1. Obtén credenciales en [Supabase Dashboard](https://supabase.com/dashboard):
   - **Access Token**: Account → Access Tokens
   - **Database Password**: Project Settings → Database
   - **Project Ref**: Project Settings → General (o usa `acfzelpmvdmeszaqlokd`)

2. Ejecuta:
   ```bash
   export SUPABASE_ACCESS_TOKEN=tu_token
   export SUPABASE_PROJECT_REF=acfzelpmvdmeszaqlokd
   export SUPABASE_DB_PASSWORD=tu_password
   npm run supabase:migrate
   ```

## Opción 3: SQL Editor en Dashboard

1. Ve a Supabase Dashboard → **SQL Editor**
2. Copia el contenido de `supabase/migrations/20260305120000_fix_profiles_rls_and_trigger.sql`
3. Pega y ejecuta

## Verificación

Tras aplicar la migración:
- La tabla `profiles` tiene RLS con políticas SELECT/INSERT/UPDATE
- El trigger `on_auth_user_created` crea perfiles automáticamente
- Los usuarios existentes sin perfil reciben uno (backfill)
- El botón guardar del perfil debe funcionar sin errores
