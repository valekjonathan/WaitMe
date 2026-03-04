# Flujo automatizado

## Pre-commit

Antes de cada `git commit`:
1. **lint-staged** → `eslint --fix` en archivos staged
2. **npm run build** → si falla, el commit se aborta

## Post-commit

Tras cada commit exitoso: `git push origin main`

## GitHub Actions

`.github/workflows/lint-and-build.yml`: lint + build en cada push a main.

## Cómo trabajar

1. Haz cambios en Cursor
2. `git add .` y `git commit -m "tu mensaje"`
3. El pre-commit ejecuta lint y build; si pasan, el commit se completa
4. El post-commit hace push automático a main

Alternativa: `npm run ship` para lint:fix → build → add → commit (el push lo hace post-commit).

---

**Estado:** Auth y perfil usan Supabase. Alertas, chat y transacciones siguen usando base44 (pendiente migración).
