# Variables de entorno y secrets — WaitMe

**Fecha:** 2026-03-07

---

## Variables obligatorias en local

| Variable | Dónde | Rompe boot |
|----------|-------|------------|
| VITE_SUPABASE_URL | .env | Sí |
| VITE_SUPABASE_ANON_KEY | .env | Sí |
| VITE_MAPBOX_TOKEN | .env | No (mapa muestra error) |

Si faltan URL o anon key (o son placeholder como `tu_anon_key`), la app muestra MissingEnvScreen y no arranca.

---

## Variables en CI (GitHub Actions)

| Secret | Obligatorio | Uso |
|--------|-------------|-----|
| VITE_SUPABASE_URL | Sí | Build, Playwright |
| VITE_SUPABASE_ANON_KEY | Sí | Build, Playwright |
| VITE_MAPBOX_TOKEN | Sí | Build, Playwright |

Configurar en: GitHub → Repo → Settings → Secrets and variables → Actions.

---

## Variables en Vercel

| Variable | Obligatorio |
|----------|-------------|
| VITE_SUPABASE_URL | Sí |
| VITE_SUPABASE_ANON_KEY | Sí |
| VITE_MAPBOX_TOKEN | Sí |

Configurar en: Vercel → Project → Settings → Environment Variables.

---

## Variables en Supabase Edge Functions

| Variable | Función |
|----------|---------|
| MAPBOX_SECRET_TOKEN | map-match |

Configurar en: Supabase Dashboard → Edge Functions → Secrets.

---

## Variables opcionales

| Variable | Uso |
|----------|-----|
| VITE_SENTRY_DSN | Sentry |
| VITE_PUBLIC_APP_URL | OAuth redirect (web) |
| VITE_OAUTH_REDIRECT_IOS | OAuth redirect (iOS). Default: capacitor://localhost. Si falla handoff, probar: com.waitme.app:// |
| VITE_USE_MAP_MATCHING | Map Matching |

---

## Placeholders que rompen boot

- `tu_anon_key`
- `TU_PROYECTO` (en URL)
- `PEGA_AQUI_EL_TOKEN` (Mapbox)

---

## Qué rompe boot vs qué rompe features

| Situación | Boot | Features |
|-----------|------|----------|
| Falta VITE_SUPABASE_URL | Sí | - |
| Falta VITE_SUPABASE_ANON_KEY | Sí | - |
| Falta VITE_MAPBOX_TOKEN | No | Mapa no carga |
| Placeholder en Supabase | Sí | - |
| Placeholder en Mapbox | No | Mapa no carga |
