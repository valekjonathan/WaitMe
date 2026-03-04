# Flujo de trabajo automatizado

## Resumen

- **Pre-commit:** eslint --fix (lint-staged) + build. Si falla, no se hace commit.
- **Post-commit:** push automático a origin/main
- **npm run ship:** lint:fix → build → commit (post-commit hace push)
- **GitHub Actions:** lint + build en cada push a main

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | ESLint con auto-corrección |
| `npm run check` | lint + build (verificación completa) |
| `npm run ship` | lint:fix → build → git add → commit (push vía post-commit) |

## Pre-commit (Husky + lint-staged)

Antes de cada `git commit`:
1. `lint-staged` ejecuta `eslint --fix` en archivos staged (corrige errores automáticamente)
2. `npm run build` — si falla, el commit se aborta y se muestra el error

## Post-commit

Tras cada commit exitoso: `git push origin main`

## Ship (flujo completo)

```bash
npm run ship
```

1. `npm run lint:fix`
2. `npm run build` — si falla, se detiene y no hace commit
3. Si todo pasa: `git add .` → `git commit -m "chore: auto-update"` (post-commit hace push)

## GitHub Actions

El workflow `.github/workflows/lint-and-build.yml` se ejecuta en cada push a main. No hay workflows de Supabase.
