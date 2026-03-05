# Configuración única en GitHub — Clics exactos

Configuración recomendada para blindar CI/CD y deployments. Hacer una sola vez.

## 1. Branch protection (main)

1. Repo → **Settings** → **Branches**
2. **Add branch protection rule**
3. Branch name: `main`
4. Activar:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - Status checks: `ci` (o el nombre del job de CI)
   - ✅ Require branches to be up to date before merging
5. **Create**

## 2. Secrets (Settings → Secrets and variables → Actions)

| Secret | Uso |
|--------|-----|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `VITE_MAPBOX_TOKEN` | Token Mapbox (para build) |
| `SUPABASE_ACCESS_TOKEN` | Token de Supabase (Dashboard → Account → Access Tokens) |
| `SUPABASE_PROJECT_REF` | Project ref (URL: `https://xxx.supabase.co` → ref = `xxx`) |
| `SUPABASE_DB_PASSWORD` | Contraseña de la base de datos |

## 3. Environment: production

1. **Settings** → **Environments**
2. Crear environment: `production`
3. (Opcional) Añadir protection rules o required reviewers para el job `migrate`

## 4. Vercel (si aplica)

1. Conectar repo en vercel.com
2. Añadir las mismas env vars que en GitHub Secrets para el build
3. Añadir `VITE_SENTRY_DSN` si se usa Sentry
