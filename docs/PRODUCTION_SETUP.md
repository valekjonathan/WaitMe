# Configuración para Producción

## GitHub Secrets

Configura estos secrets en **Settings → Secrets and variables → Actions**:

| Secret | Uso |
|--------|-----|
| `SUPABASE_ACCESS_TOKEN` | Migraciones Supabase. Obtener en [Supabase Dashboard](https://supabase.com/dashboard/account/tokens). |
| `SUPABASE_PROJECT_REF` | ID del proyecto Supabase (supabase-migrations.yml). En Dashboard → Project Settings → General. |
| `VITE_SUPABASE_URL` | Tests Playwright (tests.yml). URL del proyecto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Tests Playwright (tests.yml). Anon key de Supabase. |
| `VITE_MAPBOX_TOKEN` | Tests Playwright (tests.yml). Token de Mapbox. |

## Sentry (Producción)

Para detectar errores en producción:

1. Crea un proyecto en [sentry.io](https://sentry.io).
2. Añade a tu `.env.production` o variables de build:
   - `VITE_SENTRY_DSN` — DSN del proyecto
   - `VITE_SENTRY_RELEASE` (opcional) — ej: `git rev-parse HEAD` para el release

3. (Opcional) Sube source maps con `@sentry/vite-plugin` para stack traces legibles.
