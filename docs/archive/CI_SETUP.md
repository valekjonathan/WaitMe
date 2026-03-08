# Configuración de CI/CD — WaitMe

## Workflows activos

| Workflow | Disparador | Descripción |
|----------|------------|-------------|
| `ci.yml` | push/PR a `main` | Lint, typecheck, build |

## Secrets requeridos

Configurar en **Settings → Secrets and variables → Actions** del repositorio:

| Secret | Obligatorio | Uso |
|--------|-------------|-----|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase (ej. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Sí | Anon key de Supabase (Project Settings → API) |
| `VITE_MAPBOX_TOKEN` | Sí | Token público de Mapbox (https://account.mapbox.com/) |

El build inyecta estas variables en el bundle. Si faltan, el build puede completar pero la app mostrará pantallas de error en runtime.

## Cómo obtener los valores

1. **Supabase:** Dashboard → Project Settings → API → Project URL y anon public key
2. **Mapbox:** https://account.mapbox.com/access-tokens/ → crear token público (pk.xxx)

## Workflows deshabilitados

En `.github/workflows_disabled/` hay workflows adicionales que no se ejecutan:

- **supabase.yml:** Aplica migraciones tras CI exitoso. Requiere `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` y un environment `production`.
- **codeql.yml:** Análisis de seguridad con CodeQL.

Para reactivarlos: mover a `.github/workflows/` y configurar los secrets correspondientes.
