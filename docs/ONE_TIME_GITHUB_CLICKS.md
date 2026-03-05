# GitHub blindado — 8 clics

**Una sola vez.** Repo → Settings.

## 1. Branch protection (4 clics)

Settings → Branches → Add rule → Branch name: `main`

- ✅ Require a pull request
- ✅ Require status checks: `ci` (aparece tras el primer run)
- ✅ Require branches to be up to date
- ✅ Require linear history
- ✅ Do not allow force pushes

→ Create

## 2. Environment production (4 clics)

Settings → Environments → New environment → `production`

- ✅ Required reviewers: añadir 1+ persona
- Save protection rules

---

**Secrets** (Settings → Secrets and variables → Actions): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`
