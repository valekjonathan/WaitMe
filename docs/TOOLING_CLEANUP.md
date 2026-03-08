# Limpieza de tooling — Reducción de calor Mac

Documento de decisiones aplicadas en la limpieza de procesos y repo.

## FASE 1 — Causas del calor detectadas

| Proceso / causa | Origen |
|-----------------|--------|
| chrome-headless-shell | Playwright e2e (`npm run test`), Vitest storybook (proyecto browser) |
| Playwright | `npm run test` lanza Chromium + WebKit |
| Vitest browser | vite.config tenía proyecto storybook con @vitest/browser-playwright |
| Node huérfanos | Tests colgados, procesos que no terminan |
| Cursor Helper | Cursor IDE (no modificable) |
| SimRenderServer / SimMetalHost | iOS Simulator (necesario para dev) |
| Auto-start dev | tasks.json `runOn: folderOpen` arrancaba vite al abrir carpeta |

## FASE 2 — Correcciones aplicadas

| Archivo | Cambio |
|---------|--------|
| vite.config.js | Eliminado proyecto storybook de Vitest. Solo contracts (node). No lanza browser. |
| playwright.config.js | Local: solo Chromium (1 browser). CI: Chromium. Eliminado WebKit en local. |
| .vscode/tasks.json | Eliminado `runOn: folderOpen`. Dev server no arranca automáticamente. |
| scripts/dev-cleanup.sh | Más patrones: Chromium headless, vitest run, node playwright/vitest |
| scripts/test-cleanup.sh | Más patrones: Chromium headless, node playwright test, node vitest |

## FASE 3 — Clasificación repo

| Elemento | Decisión | Justificación |
|----------|----------|---------------|
| .cursor/ | SE QUEDA | Reglas Cursor |
| .husky/ | SE QUEDA | Git hooks (pre-commit) |
| .storybook/ | SE QUEDA | Component dev, Storybook |
| quarantine/ | ARCHIVADO | Movido a docs/archive/quarantine. No runtime. |
| force-sync.txt | ELIMINADO | Archivo temporal sin uso |
| tests/visual/*-snapshots | SE QUEDA | Necesarios para tests visuales |
| CAPACITOR_DEV.md | SE QUEDA | Doc útil |
| docs/archive | SE QUEDA | Documentación archivada |

## Exclusiones ZIP (tmp/waitme-tooling-clean.zip)

- .env, .env.local, .env.*
- node_modules, dist, coverage
- playwright-report, test-results
- .git, ios/App/App/public/assets
- .DS_Store
- docs/archive/quarantine (archivado)
- tests/visual/*-snapshots (imágenes, no aportan al análisis)
