# Inventario del Entorno WaitMe

**Fecha:** Marzo 2026  
**Propósito:** Lista exhaustiva de scripts, herramientas, dependencias y configuraciones del proyecto.

---

## 1. SCRIPTS NPM

| Script | Comando | Uso |
|--------|---------|-----|
| `predev` | rm -rf ios/App/App/public/assets | Limpieza previa a dev |
| `dev` | vite --host --port 5173 | Servidor desarrollo web |
| `build` | vite build | Build producción |
| `lint` | eslint . --max-warnings=9999 | Lint completo |
| `lint:fix` | eslint . --fix | Lint con auto-fix |
| `lint:fast` | biome check src tests | Lint rápido (Biome) |
| `test` | vitest run | Tests unitarios |
| `test:all` | playwright + safe-mode | E2E + smoke safe |
| `test:safe-mode` | VITE_SAFE_MODE playwright | Smoke safe mode |
| `test:e2e` | playwright test | E2E |
| `test:e2e:ui` | playwright test --ui | E2E con UI |
| `test:contracts` | vitest run tests/contracts | Tests de contratos |
| `test:ui` | playwright test --ui | Alias test:e2e:ui |
| `test:visual` | percy exec -- playwright test | Visual regression (Percy) |
| `format` | prettier --write . | Formatear todo |
| `format:check` | prettier --check . | Verificar formato |
| `typecheck` | tsc --noEmit | TypeScript check |
| `check` | lint && build | Lint + build |
| `export-codebase` | node scripts/export-codebase.js | Exportar código |
| `export-zip` | bash scripts/export-zip-safe.sh | ZIP del proyecto |
| `ship` | bash scripts/ship.sh | Deploy/ship |
| `prepare` | husky | Instalar husky |
| `preview` | vite preview --port 4173 | Preview build |
| `dev:ios` | bash scripts/dev-ios.sh | Dev iOS |
| `ios:fresh` | bash scripts/ios-fresh.sh | Build limpio + sync + instalar |
| `ios:dev` | npm run ios:fresh | Alias |
| `ios:live` | bash scripts/ios-live.sh | Dev server + live reload |
| `ios:watch` | bash scripts/ios-watch.sh | chokidar rebuild + sync |
| `ios:clean` | rm -rf dist ios/App/App/public DerivedData | Limpieza iOS |
| `ios:logs` | xcrun simctl spawn booted log stream | Logs Simulator |
| `ios:sync:dev` | build + CAPACITOR_USE_DEV_SERVER cap sync | Sync con dev server |
| `ios:sync` | build + cap sync | Sync normal |
| `ios:open` | npx cap open ios | Abrir Xcode |
| `ios:reset` | bash scripts/ios-reset.sh | Reset iOS |
| `ios:run` | bash scripts/ios-run.sh | Ejecutar app |
| `ios:run:dev` | CAPACITOR_USE_DEV_SERVER cap run ios | Run con dev server |
| `supabase:migrate` | bash scripts/supabase-migrate.sh | Migraciones Supabase |
| `supabase:migrate:direct` | node scripts/run-profile-migration.mjs | Migración directa |
| `db:migrate:print` | node -e "..." | Imprimir última migración |
| `diagnose` | node scripts/diagnose-project.js | Diagnóstico proyecto |
| `storybook` | storybook dev -p 6006 | Storybook dev |
| `build-storybook` | storybook build | Build Storybook |
| `audit:repo` | knip | Auditoría Knip (exports no usados) |
| `check:fast` | build + test:e2e load.spec | Build + smoke load |
| `dev:safe` | VITE_SAFE_MODE vite | Dev en modo seguro |
| `env:guard` | bash scripts/environment-guard.sh | Verificar env |
| `pwa:validate` | node scripts/pwa-icon-validator.mjs | Validar PWA icons |
| `supabase:redirect-urls` | node scripts/print-supabase-redirect-urls.js | URLs redirect |
| `supabase:ensure-oauth-ios` | node scripts/ensure-oauth-redirect-ios.js | OAuth iOS |
| `cleanup:tests` | bash scripts/test-cleanup.sh | Limpieza tests |
| `cleanup:dev` | bash scripts/dev-cleanup.sh | Limpieza dev |

---

## 2. SCRIPTS BASH / NODE (scripts/)

| Script | Tipo | Función |
|--------|------|---------|
| capture-boot-error.mjs | Node | Capturar errores de arranque |
| check_migrations_safety.sh | Bash | Verificar seguridad migraciones |
| configure-supabase-secrets.sh | Bash | Configurar secrets Supabase |
| dev-cleanup.sh | Bash | Limpieza entorno dev |
| dev-ios.sh | Bash | Dev iOS |
| diagnose-project.js | Node | Diagnóstico proyecto |
| ensure-oauth-redirect-ios.js | Node | Asegurar OAuth redirect iOS |
| environment-guard.sh | Bash | Guard env vars |
| export-codebase.js | Node | Exportar código |
| export-zip-safe.sh | Bash | ZIP seguro |
| generate-apple-touch-icon.mjs | Node | Icono Apple touch |
| get-ip.js | Node | Obtener IP |
| github_hardening.sh | Bash | Hardening GitHub |
| ios-fresh.sh | Bash | Build limpio + sync + instalar iOS |
| ios-live.sh | Bash | Dev + live reload iOS |
| ios-rebuild-and-sync.sh | Bash | Rebuild + sync |
| ios-reset.sh | Bash | Reset iOS |
| ios-run.sh | Bash | Ejecutar app iOS |
| ios-watch.sh | Bash | Watch + rebuild + sync |
| measure-layout.mjs | Node | Medir layout |
| print-supabase-redirect-urls.js | Node | Imprimir URLs redirect |
| pwa-icon-validator.mjs | Node | Validar PWA |
| run-layout-measurement.js | Node | Ejecutar medición layout |
| run-profile-migration.mjs | Node | Migración perfiles |
| ship.sh | Bash | Ship/deploy |
| supabase-migrate.sh | Bash | Migrar Supabase |
| test-cleanup.sh | Bash | Limpieza tests |
| validate-ios-oauth.sh | Bash | Validar OAuth iOS |

---

## 3. DEPENDENCIAS CLAVE

### Producción

| Paquete | Versión | Uso |
|---------|---------|-----|
| @capacitor/* | ^8.x | iOS, app, preferences, browser, status-bar |
| @supabase/supabase-js | ^2.98 | Auth, DB, Realtime, Storage |
| @tanstack/react-query | ^5.84 | Cache y fetching |
| mapbox-gl | ^3.19 | Mapas |
| react | ^18.2 | UI |
| react-router-dom | ^6.26 | Navegación |
| framer-motion | ^11.16 | Animaciones |
| @sentry/react | ^10.42 | Error monitoring |
| zustand | ^5.0 | Estado global (no usado actualmente) |

### Desarrollo

| Paquete | Versión | Uso |
|---------|---------|-----|
| vite | ^6.1 | Build |
| eslint | ^9.19 | Linting |
| @biomejs/biome | ^2.4 | Lint rápido |
| prettier | ^3.8 | Formato |
| typescript | ^5.8 | TypeScript |
| @playwright/test | ^1.58 | E2E |
| vitest | ^4.0 | Unit tests |
| storybook | ^10.2 | Componentes |
| @percy/playwright | ^1.0 | Visual regression |
| knip | ^5.85 | Auditoría exports |
| husky | ^9.1 | Git hooks |
| lint-staged | ^15.4 | Pre-commit |
| supabase | ^2.76 | CLI Supabase |
| chokidar-cli | ^3.0 | Watch para ios:watch |

---

## 4. ARCHIVOS DE CONFIGURACIÓN CLAVE

| Archivo | Propósito |
|---------|-----------|
| vite.config.js | Vite, plugins, alias |
| capacitor.config.ts | Capacitor, server.url condicional |
| eslint.config.js | ESLint flat config |
| tailwind.config.js | Tailwind |
| postcss.config.js | PostCSS |
| playwright.config.js | Playwright E2E |
| tsconfig.json | TypeScript |
| .nvmrc | Node version |
| .cursorignore | Exclusiones Cursor |
| .husky/ | Hooks pre-commit |
| .lintstagedrc | Lint-staged config |

---

## 5. EXTENSIONES / CONFIGS DEL PROYECTO (detectables desde repo)

| Elemento | Ubicación |
|----------|-----------|
| Cursor rules | .cursor/rules/*.mdc |
| WAITME_AGENT_CONTEXT | docs/WAITME_AGENT_CONTEXT.md |
| CURSOR_RULES_WAITME | docs/CURSOR_RULES_WAITME.md |
| SAFE_CHANGE_PROTOCOL | docs/SAFE_CHANGE_PROTOCOL.md |
| MAP_DEBUG_CHECKLIST | docs/MAP_DEBUG_CHECKLIST.md |

---

## 6. AUTOMATIZACIONES EXISTENTES

| Automatización | Cómo | Estado |
|----------------|------|--------|
| Pre-commit | Husky + lint-staged | ✓ Prettier + ESLint |
| CI | GitHub Actions ci.yml | ✓ Lint, typecheck, build |
| ios:fresh | Script | ✓ Limpia, build, sync, elimina server.url, instala |
| ios:live | Script | ✓ Dev server + live reload; cleanup al salir |
| ios:watch | chokidar | ✓ Rebuild + sync + restart |
| cap sync | Script post-sync | ✓ Elimina server.url en runtime config |

---

## 7. AUTOMATIZACIONES FALTANTES

| Automatización | Propuesta |
|----------------|-----------|
| E2E en CI | Añadir `playwright test` a ci.yml |
| Pre-push | lint + typecheck + build + test smoke |
| Comando único dev:ios:full | ios:fresh + opcional live |
| Health check Supabase | Al arrancar app |
| Logs estructurados | Sustituir console.log dispersos |
| Diagnóstico auth runtime | Similar a __WAITME_DIAG__ |

---

## 8. QUÉ USA REALMENTE EL FLUJO DIARIO

| Flujo | Comandos típicos |
|-------|------------------|
| Dev web | `npm run dev` |
| Dev iOS | `npm run ios:fresh` o `npm run ios:live` |
| Rebuild iOS | `npm run ios:watch` |
| Validar | `npm run lint`, `npm run typecheck`, `npm run build` |
| Tests | `npm run test`, `npm run test:e2e` |
| Ship | `npm run ship` (manual) |

---

## 9. QUÉ NO APORTA VALOR O PUEDE ELIMINARSE/ARCHIVARSE

| Elemento | Motivo |
|----------|--------|
| turbo.json | No se usa Turborepo |
| ios:dev | Alias de ios:fresh; redundante |
| ios:run vs ios:run:dev | Consolidar documentación |
| lint:fast (Biome) | Si ESLint cubre todo, evaluar eliminar Biome |
| docs/archive (~80 docs) | Ya archivados; revisar si alguno debe reactivarse |
| .github/workflows_disabled | Workflows deshabilitados; archivar o eliminar |
| zustand en deps | No usado; eliminar o usar |

---

## 10. GITHUB WORKFLOWS

| Workflow | Estado |
|----------|--------|
| .github/workflows/ci.yml | Activo — lint, typecheck, build |
| .github/workflows_disabled/ci.yml | Deshabilitado |
| .github/workflows_disabled/supabase.yml | Deshabilitado |
| .github/workflows_disabled/codeql.yml | Deshabilitado |
| .github/dependabot.yml | Activo |

---

## 11. .CURSORIGNORE (exclusiones)

- node_modules, dist, coverage
- tests, playwright-report, test-results, snapshots
- .storybook, storybook-static
- supabase, ios
- scripts
- docs/archive, quarantine, tmp
- .DS_Store

**Impacto:** El agente no indexa scripts, tests, supabase, ios. Reduce contexto para modificaciones en esas áreas.
