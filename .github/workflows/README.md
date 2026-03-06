# GitHub Actions

## Activo

- **ci.yml** — Ejecuta en push/PR a `main`: lint, typecheck, build. Ver `docs/CI_SETUP.md` para secrets.

## Deshabilitados

Los workflows en `.github/workflows_disabled/` (supabase, codeql) no se ejecutan. Para reactivarlos: mover a `.github/workflows/` y configurar secrets.
