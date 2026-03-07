# Reporte de Exploración Exhaustiva — Proyecto WaitMe

**Fecha:** 7 de marzo de 2025  
**Ruta:** `/Users/jonathanalvarez/Desktop/WaitMenuevo`

---

## 1. Estructura de carpetas real

```
WaitMenuevo/
├── .cursor/rules/           # Reglas Cursor (instrucciones, waitme)
├── .github/
│   ├── workflows/           # CI activo
│   └── workflows_disabled/  # Workflows deshabilitados (manual)
├── .husky/                  # Git hooks (pre-commit)
├── .storybook/              # Config Storybook
├── .vscode/                 # Tasks, settings
├── components/              # components.json (shadcn/ui)
├── docs/                    # ~80+ documentos markdown
├── ios/
│   └── App/
│       ├── App/             # App Capacitor (Swift, plist, assets)
│       ├── App.xcodeproj/   # Proyecto Xcode
│       ├── CapApp-SPM/      # Swift Package
│       └── DerivedData/     # Build cache
├── public/                  # Assets estáticos
├── quarantine/              # Código deprecado (no importado)
│   ├── components/
│   ├── github-workflows/
│   ├── hooks/
│   ├── lib/
│   │   └── maps/
│   ├── realtime/
│   └── services/
├── scripts/                 # 18 scripts (ship, migrate, diagnose, etc.)
├── src/
│   ├── components/          # UI + map + cards
│   ├── config/
│   ├── core/
│   ├── data/
│   ├── dev/
│   ├── diagnostics/
│   ├── hooks/
│   ├── lib/
│   │   ├── location/
│   │   ├── locationPipeline/
│   │   ├── stripe/
│   │   └── transaction/
│   ├── pages/
│   ├── services/
│   ├── stores/
│   ├── stories/
│   ├── system/
│   │   ├── layout/
│   │   └── map/
│   ├── types/
│   └── utils/
├── supabase/
│   ├── functions/           # Edge: map-match, release-payment
│   └── migrations/          # 18 migraciones SQL
├── tests/
│   ├── contracts/          # 15 tests Vitest
│   ├── layout/
│   ├── smoke/
│   ├── validation/
│   └── visual/
└── tmp/                     # Exports, auditorías
```

---

## 2. Archivos en cada directorio clave

### `src/` (~142 archivos JS/JSX/TS/TSX/CSS)

| Directorio | Archivos principales |
|------------|----------------------|
| **components/** | AddressAutocompleteInput, BottomNav, CenterPin, CreateMapOverlay, DemoFlowManager, Header, IncomingRequestModal, LocationEngineStarter, Logo, MapZoomControls, MapboxMap, SearchMapOverlay, SellerLocationTracker, StreetSearch, WaitMeRequestScheduler |
| **components/cards/** | CreateAlertCard, MarcoCard, UserAlertCard |
| **components/map/** | MapFilters, ParkingMap |
| **components/ui/** | badge, button, dialog, input, label, select, slider, switch, tabs, use-toast |
| **config/** | alerts.js |
| **core/** | ErrorBoundary.jsx |
| **data/** | alerts, chat, notifications, profiles, transactions, uploads, userLocations |
| **dev/** | diagnostics, layoutInspector |
| **diagnostics/** | MissingEnvScreen, SafeModeShell |
| **hooks/** | useArrivingAnimation, useLocationEngine, useMyAlerts, useProfileGuard, useTransactionMonitoring |
| **lib/** | AuthContext, LayoutContext, alertSelectors, alertsQueryKey, finalizedAtStore, geohash, profile, runtimeConfig, sentry, supabaseClient, transactionEngine, utils, vehicleIcons, waitmeRequests |
| **lib/location/** | distanceEngine, etaEngine, getPreciseInitialLocation, index, locationEngine, locationFraudDetector, locationFraudLogs, locationMovementValidator, locationSmoothing, proximityEngine |
| **lib/locationPipeline/** | index, locationDiagnosticsLogger, locationFraudDetector, locationKalmanFilter, locationMapMatcher, locationMovementValidator, locationPipeline, locationPrediction, locationSmoothingAdvanced |
| **lib/stripe/** | README, stripeService |
| **lib/transaction/** | arrivalConfidenceEngine, arrivalConfidenceLogger, index, transactionEngine, transactionLogger, transactionStates |
| **pages/** | Chat, Chats, DevDiagnostics, History, HistoryBuyerView, HistorySellerView, Home, Login, Navigate, NotificationSettings, Notifications, Profile, Settings |
| **services/** | alertsSupabase, chatSupabase, notificationsSupabase, profilesSupabase, transactionsSupabase, uploadsSupabase, userLocationsSupabase |
| **stores/** | carsMovementStore |
| **stories/** | Button, Configure.mdx, Header, Page + assets |
| **system/layout/** | AppDeviceFrame, BottomNavLayer, MapLayer, OverlayLayer, index |
| **system/map/** | MapScreenPanel, MapViewportShell, index |
| **types/** | global.d.ts |
| **utils/** | carUtils, index.ts |
| **Root** | App.jsx, Layout.jsx, main.jsx, globals.css, index.css, styles/no-zoom.css |

### `tests/` (31 archivos)

| Tipo | Archivos |
|------|----------|
| **E2E (Playwright)** | app.spec.js, layout-device-frame.spec.js, layout-map-create.spec.js, map.spec.js, profile.spec.js |
| **layout/** | map-layout.spec.js |
| **smoke/** | create.spec.js, diagnostics.spec.js, load.spec.js, safe-mode.spec.js |
| **validation/** | drag-validation.spec.js, measure-layout-real.spec.js, scroll-validation.spec.js |
| **visual/** | create-card-position.spec.js, map-shell-unified.spec.js, measure-card-nav-gap.spec.js, verify-ubicate-button.spec.js |
| **contracts (Vitest)** | alerts, arrivalConfidenceEngine, chat, locationEngine, locationFraud, locationInitialFix, locationPipeline, mockNavigateCars, notifications, transactionEngine, transactionPayment, transactions, uploads, userLocations (15 archivos .test.js) |

### `supabase/`

| Elemento | Detalle |
|----------|---------|
| **config.toml** | project_id: WaitMeNuevo, API, DB, auth, storage, realtime, edge |
| **migrations/** | 18 archivos SQL (profiles, parking_alerts, core, transactions, notifications, etc.) |
| **functions/** | map-match/index.ts, release-payment/index.ts |
| **seed.sql** | Datos iniciales |

### `ios/`

| Elemento | Detalle |
|----------|---------|
| **App/App/** | AppDelegate.swift, Info.plist, Assets.xcassets, capacitor.config.json, public/ |
| **App/CapApp-SPM/** | Package.swift, CapApp-SPM.swift |

### `scripts/` (18 archivos)

- `ship.sh`, `dev-ios.sh`, `ios-run.sh`, `ios-reset.sh`
- `supabase-migrate.sh`, `run-profile-migration.mjs`, `check_migrations_safety.sh`
- `diagnose-project.js`, `export-codebase.js`
- `environment-guard.sh`, `configure-supabase-secrets.sh`
- `pwa-icon-validator.mjs`, `generate-apple-touch-icon.mjs`
- `run-layout-measurement.js`, `measure-layout.mjs`
- `capture-boot-error.mjs`, `get-ip.js`, `github_hardening.sh`

### `quarantine/` (código deprecado)

- **components/** — ActiveAlertCard, ErrorBoundary, UserNotRegisteredError
- **hooks/** — useAlertsQuery, useDebouncedSave, useMapMatch, use-mobile
- **lib/** — PageNotFound, logger, query-client, pages.config.js
- **lib/maps/** — carUtils, mapConstants, mapMarkers
- **realtime/** — alertsRealtime, appStore, useRealtimeAlerts
- **services/** — alertService
- **github-workflows/** — ci.yml, README

---

## 3. Dependencias principales (package.json)

### Producción

| Categoría | Paquetes |
|-----------|----------|
| **Capacitor** | @capacitor/app, browser, cli, core, ios, preferences, status-bar |
| **UI (Radix)** | @radix-ui/* (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, select, slider, switch, tabs, toast, tooltip, etc.) |
| **Data** | @supabase/supabase-js, @tanstack/react-query, zustand |
| **Forms** | react-hook-form, @hookform/resolvers, zod |
| **Mapas** | mapbox-gl, ngeohash |
| **Otros** | @hello-pangea/dnd, clsx, cmdk, date-fns, framer-motion, lucide-react, next-themes, react-router-dom, recharts, sonner, vaul, @sentry/react |

### Desarrollo

| Categoría | Paquetes |
|-----------|----------|
| **Testing** | @playwright/test, playwright, vitest, @vitest/browser-playwright, @vitest/coverage-v8, @percy/cli, @percy/playwright |
| **Storybook** | storybook, @storybook/addon-a11y, addon-docs, addon-onboarding, addon-vitest, react-vite, @chromatic-com/storybook |
| **Lint/Format** | eslint, @eslint/js, eslint-config-prettier, eslint-plugin-*, @biomejs/biome, prettier |
| **Build** | vite, @vitejs/plugin-react, typescript, tailwindcss, postcss, autoprefixer |
| **Otros** | husky, lint-staged, knip, supabase, pg, sharp, turbo |

### Scripts relevantes

| Script | Comando |
|--------|---------|
| dev | vite --host --port 5173 |
| build | vite build |
| test | playwright test |
| test:contracts | vitest run tests/contracts |
| test:visual | percy exec -- playwright test |
| ios:sync | build + cap sync |
| ios:run:dev | Capacitor con dev server |
| supabase:migrate | bash scripts/supabase-migrate.sh |
| dev:safe | VITE_SAFE_MODE=true vite |
| diagnose | node scripts/diagnose-project.js |

---

## 4. Workflows en .github/

### Activo: `.github/workflows/ci.yml`

- **Triggers:** push/PR en `main`
- **Pasos:** checkout → setup Node (.nvmrc) → npm install → lint → typecheck → build → install Playwright → playwright test
- **Secrets:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

### Deshabilitados (workflow_dispatch solo)

| Archivo | Propósito |
|---------|-----------|
| `workflows_disabled/ci.yml` | CI completo + check_migrations_safety, contract tests, artifacts |
| `workflows_disabled/codeql.yml` | Análisis de seguridad CodeQL (JavaScript) |
| `workflows_disabled/supabase.yml` | Migraciones Supabase (reset local + push prod) |

### Dependabot

- **dependabot.yml:** actualización semanal (lunes) de npm y GitHub Actions
- Grupos: dev-dependencies (minor/patch), labels: dependencies

---

## 5. Configuración de Vite, Capacitor, Supabase

### Vite (`vite.config.js`)

- **Alias:** `@` → `./src`
- **Base:** `./`
- **Puerto:** 5173 (strictPort)
- **fs/watch:** ignora `ios__backup*/`, `DerivedData/`, `ios/`
- **Vitest:** 2 proyectos — contracts (Node), storybook (browser + playwright)
- **Build:** outDir `dist`, assetsInlineLimit 200000

### Capacitor (`capacitor.config.ts`)

- **appId:** com.waitme.app
- **appName:** WaitMe
- **webDir:** dist
- **bundledWebRuntime:** false
- **Dev server:** CAPACITOR_USE_DEV_SERVER → url desde env o localhost:5173

### Supabase (`supabase/config.toml`)

- **project_id:** WaitMeNuevo
- **API:** port 54321, schemas public, graphql_public
- **DB:** port 54322, major_version 17, migrations enabled, seed.sql
- **Realtime:** enabled
- **Auth:** enabled, email signup, JWT 3600s
- **Storage:** enabled, 50MiB limit
- **Edge runtime:** enabled, Deno 2

### TypeScript (`tsconfig.json`)

- target ES2020, module ESNext
- paths: `@/*` → src/*
- include: src, tests, *.config.js
- exclude: node_modules, dist, ios

### Playwright (`playwright.config.js`)

- **testDir:** ./tests
- **testIgnore:** contracts/**, validation/** (en CI)
- **Port:** 5174 (PLAYWRIGHT_PORT)
- **Geolocation:** Oviedo (43.3619, -5.8494)
- **Projects:** webkit-mobile (iPhone 14) en CI; + chromium en local
- **webServer:** Vite en puerto configurado

---

## 6. Tests existentes y estado

### Playwright (E2E)

- **Config:** playwright.config.js
- **Ubicación:** tests/*.spec.js, tests/smoke/, tests/layout/, tests/visual/
- **Ignorados:** tests/contracts/; tests/validation/ en CI
- **Estado:** Configurado para webkit-mobile y chromium

### Vitest (contracts)

- **Config:** vite.config.js (test block)
- **Ubicación:** tests/contracts/**/*.test.js (15 archivos)
- **Entorno:** Node
- **Estado:** `npm run test:contracts`

### Storybook + Vitest

- **Setup:** .storybook/vitest.setup.ts
- **Addon:** @storybook/addon-vitest
- **Provider:** @vitest/browser-playwright (chromium)

### Percy (visual)

- **Comando:** test:visual → percy exec -- playwright test
- **Config:** .percy.yml (widths 375, 1280)

### tests/unit/

- Directorio presente pero vacío o sin archivos relevantes en la búsqueda.

---

## 7. Archivos de entorno

| Archivo | Estado |
|---------|--------|
| **.env.example** | Presente — plantilla completa |
| **.env** | Probablemente en .gitignore (no listado en glob) |

### Variables en .env.example

**Obligatorias:**
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_MAPBOX_TOKEN

**Opcionales:**
- VITE_USE_MAP_MATCHING
- VITE_SENTRY_DSN

**Dev:**
- VITE_SAFE_MODE, VITE_DISABLE_MAP, VITE_DISABLE_REALTIME
- VITE_BYPASS_AUTH, VITE_DEV_BYPASS_AUTH, VITE_HARD_BYPASS_APP
- VITE_CAPACITOR_SERVER_URL

**Supabase CLI:**
- SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD, SUPABASE_DB_URL

---

## 8. Archivos duplicados o legacy

### Duplicados en src/

| Módulo | Ubicaciones | Uso |
|--------|-------------|-----|
| **locationFraudDetector** | `src/lib/location/` y `src/lib/locationPipeline/` | transactionEngine usa `@/lib/location/`; locationPipeline usa su propia versión |
| **locationMovementValidator** | `src/lib/location/` y `src/lib/locationPipeline/` | Dos implementaciones paralelas |

### Quarantine vs activo

| Quarantine | Activo |
|------------|--------|
| components/ErrorBoundary.jsx | src/core/ErrorBoundary.jsx |
| lib/maps/carUtils.js | src/utils/carUtils.js |

### Legacy / deshabilitado

- **.github/workflows_disabled/** — workflows solo manual
- **quarantine/** — componentes, hooks, lib, services, realtime deprecados
- **tests/unit/** — directorio presente, posiblemente sin uso

### No encontrado

- Archivos *.old, *.bak, *-copy*

---

## Resumen ejecutivo

- **Stack:** React 18 + Vite 6 + Capacitor 8 + Supabase + Mapbox
- **Tests:** Playwright E2E + Vitest contracts + Storybook + Percy visual
- **CI:** Un workflow activo (lint, typecheck, build, playwright)
- **Duplicados:** locationFraudDetector y locationMovementValidator en location/ y locationPipeline/
- **Legacy:** quarantine/ y workflows_disabled/ documentados y aislados
