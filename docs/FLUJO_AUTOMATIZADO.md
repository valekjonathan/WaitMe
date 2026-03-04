# Flujo de trabajo automatizado

## Resumen

- **Pre-commit:** lint + auto-fix en archivos staged antes de cada commit
- **npm run ship:** lint:fix → build → commit → push (un solo comando)
- **GitHub Actions:** lint + build en cada push a main

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | ESLint con auto-corrección |
| `npm run check` | lint + build (verificación completa) |
| `npm run ship` | lint:fix → build → git add → commit → push |

## Pre-commit (Husky + lint-staged)

Al hacer `git commit`, se ejecuta automáticamente `lint-staged`, que aplica `eslint --fix` a los archivos staged. Si hay errores que no se pueden corregir, el commit se aborta.

## Ship (flujo completo)

```bash
npm run ship
```

1. Ejecuta `npm run lint:fix`
2. Ejecuta `npm run build`
3. Si todo pasa: `git add .` → `git commit -m "chore: auto-update"` → `git push origin main`
4. Si hay errores: se detiene y no hace commit

## GitHub Actions

El workflow `.github/workflows/lint-and-build.yml` se ejecuta en cada push a main y verifica lint y build. No hay workflows de Supabase.
