# WaitMe — Comprehensive Audit Report (March 2026)

## 1. Project Structure (Tree)

```
WaitMe/
├── .cursor/
│   └── rules/
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   ├── workflows_disabled/
│   │   ├── ci.yml
│   │   ├── codeql.yml
│   │   └── supabase.yml
│   ├── dependabot.yml
│   └── INTEGRACIONES_EXTERNAS.md
├── .husky/
├── .maestro/flows/
├── .storybook/
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   ├── launch.json
│   └── tasks.json
├── audit/
├── docs/
│   ├── archive/           # ~80+ archived docs
│   │   └── quarantine/
│   ├── AUDITORIA_MAESTRA_WAITME.md
│   └── WAITME_AGENT_CONTEXT.md
├── functions/
├── ios/
│   └── App/
│       ├── App.xcodeproj/
│       ├── App/            # Capacitor app
│       └── CapApp-SPM/
├── public/
│   ├── icons/
│   └── manifest.json
├── scripts/
│   ├── ios-fresh.sh
│   ├── ios-live.sh
│   ├── ios-watch.sh
│   ├── ios-run.sh
│   ├── ios-reset.sh
│   ├── ship.sh
│   ├── dev-ios.sh
│   ├── ensure-oauth-redirect-ios.js
│   ├── validate-ios-oauth.sh
│   └── ...
├── src/
│   ├── App.jsx
│   ├── Layout.jsx
│   ├── main.jsx
│   ├── assets/
│   ├── components/
│   │   ├── map/            # MapboxMap, MapInit, MapLayers, MapEvents, MapControls, MapMarkers
│   │   ├── cards/          # CreateAlertCard
│   │   ├── home/
│   │   ├── profile/
│   │   ├── history/
│   │   ├── chat/
│   │   └── ui/
│   ├── config/
│   ├── core/
│   ├── data/
│   ├── diagnostics/
│   ├── hooks/
│   ├── lib/
│   │   ├── location/       # locationEngine, getPreciseInitialLocation, getLastKnownLocation
│   │   ├── locationPipeline/
│   │   ├── mapLayers/
│   │   ├── AuthContext.jsx
│   │   ├── supabaseClient.js
│   │   ├── oauthCapture.js
│   │   └── runtimeConfig.js
│   ├── pages/
│   ├── services/
│   ├── stores/
│   ├── stories/
│   ├── system/
│   └── utils/
├── supabase/
│   ├── migrations/
│   └── functions/
├── tests/
│   ├── smoke/
│   ├── layout/
│   ├── visual/
│   ├── validation/
│   └── contracts/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.js
├── postcss.config.js
├── capacitor.config.ts
├── playwright.config.js
├── turbo.json
├── knip.json
├── vercel.json
└── .percy.yml
```

---

## 2. Auth Flow Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUTH / OAUTH FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

BOOT (main.jsx)
    │
    ├─► initOAuthCapture()  [oauthCapture.js] — ONLY on Capacitor native
    │       │
    │       ├─► CapacitorApp.addListener('appUrlOpen', processOAuthUrl)
    │       └─► CapacitorApp.getLaunchUrl() → processOAuthUrl(url)
    │               │
    │               └─► exchangeCodeForSession(code) OR setSession(access_token, refresh_token)
    │                       │
    │                       └─► window.__WAITME_OAUTH_COMPLETE = true
    │                       └─► dispatchEvent('waitme:oauth-complete')
    │
    └─► AuthProvider → HashRouter → QueryClientProvider → App

APP.jsx (Capacitor native)
    │
    ├─► CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen)  [DUPLICATE listener]
    ├─► CapacitorApp.getLaunchUrl() → processOAuthUrl(url, onOAuthSuccess)
    └─► window.addEventListener('waitme:oauth-complete', onOAuthComplete)
    └─► window.__WAITME_OAUTH_COMPLETE → onOAuthSuccess()

onOAuthSuccess:
    └─► checkUserAuth() → resolveSession()
    └─► navigate('/', { replace: true })

AuthContext.jsx
    │
    ├─► resolveSession(): getSession() → getUser() → ensureUserInDb() → setUser/setProfile
    ├─► onAuthStateChange: SIGNED_IN, TOKEN_REFRESHED → ensureUserInDb → setUser
    ├─► Hash #access_token (web): setSession → resolveSession
    └─► authInFlightRef guards race conditions

supabaseClient.js
    │
    ├─► Capacitor: storage = capacitorStorage (Preferences)
    ├─► flowType: 'pkce'
    └─► clearSupabaseAuthStorage() on logout

Login.jsx
    │
    ├─► Native: signInWithOAuth({ redirectTo: com.waitme.app://auth/callback, skipBrowserRedirect: true })
    ├─► InAppBrowser.openInExternalBrowser(data.url)
    └─► Web: signInWithOAuth({ redirectTo: VITE_PUBLIC_APP_URL })
```

**Race conditions / notes:**
- **Dual OAuth handlers**: `oauthCapture.js` runs before React; `App.jsx` also registers `appUrlOpen` and `getLaunchUrl`. Both can process the same URL → potential double `exchangeCodeForSession` (Supabase may handle idempotently).
- **window.__WAITME_OAUTH_COMPLETE**: Used as fallback when event fires before App mounts.
- **authInFlightRef**: Prevents concurrent `resolveSession` calls.

---

## 3. Map / Ubícate Flow Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MAP / UBÍCATE FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

Home.jsx
    │
    └─► MapboxMap
            │ locationFromEngine (from LocationEngineStarter)
            │ suppressInternalWatcher={!!engineLocation}
            │ initialLocation, onRecenterRef

MapboxMap.jsx
    │
    ├─► createMap(container) → mapboxgl.Map
    ├─► map.on('load') → setupMapStyleOnLoad, setMapReady(true)
    │       └─► window.waitmeMap = { isReady, flyToUser(lng, lat, opts) }
    │
    ├─► Location source (when suppressInternalWatcher=false AND locationFromEngine==null):
    │       ├─► getPreciseInitialLocation() → setLocation
    │       └─► watchPosition() → setLocation
    │
    ├─► effectiveCenter = initialCenter ?? engineCenter ?? location ?? OVIEDO_CENTER
    ├─► applyUserLocationLayer(map, userCoordsForMarker)
    └─► applyStaticCarsLayer, applyWaitMeCarLayer

CreateAlertCard.jsx — "Ubícate" button
    │
    └─► handleLocate():
            ├─► loc = getLastKnownLocation() || await getPreciseInitialLocation()
            ├─► window.waitmeMap?.flyToUser(loc.lng, loc.lat, { zoom: 17 })
            └─► onRecenter?.({ lat, lng })

useHomeActions.js — getCurrentLocation (logo recenter)
    │
    └─► getPreciseInitialLocation() → setUserLocation, setSelectedPosition, reverseGeocode

locationEngine.js
    │
    ├─► getPreciseInitialLocation() (first position, skipPipeline)
    ├─► watchPosition() → notify (with optional pipeline)
    └─► getLastKnownLocation() → lastKnown

getPreciseInitialLocation.js
    └─► getCurrentPosition(enableHighAccuracy, timeout 10s, maximumAge 0)
    └─► Retry up to 3x if accuracy > 50m
```

**Potential race:**
- Ubícate calls `flyToUser` before `map.on('load')` → `window.waitmeMap` may not be ready → `locateFailureReason` in `__WAITME_DIAG__`.

---

## 4. iOS Scripts Summary

| Script | Purpose |
|--------|---------|
| **ios-fresh.sh** | Full clean: rm dist/public/DerivedData, build, cap sync (no server.url), remove server from runtime config, cap run ios. Target: iPhone 16e. |
| **ios-live.sh** | Dev server + live reload. Starts `npm run dev`, waits for port 5173, cap run --live-reload. On exit: restores clean config, reinstalls. |
| **ios-watch.sh** | Watches `src/**/*`, runs `ios-rebuild-and-sync.sh` on change. |
| **ios-run.sh** | Runs iOS app (see scripts/). |
| **ios-reset.sh** | Reset script. |
| **dev-ios.sh** | Dev iOS workflow. |

**capacitor.config.ts:**
- `server.url` only when `CAP_LIVE_RELOAD=true` or `CAPACITOR_USE_DEV_SERVER=true`
- Default: bundled build, no localhost dependency

**Runtime config:** `ios/App/App/capacitor.config.json` — ios-fresh removes `server` key to avoid white screen.

---

## 5. package.json Scripts

| Script | Description |
|--------|-------------|
| `predev` | Remove ios/App/App/public/assets |
| `dev` | vite --host --port 5173 |
| `build` | vite build |
| `lint` | eslint . --max-warnings=9999 |
| `lint:fix` | eslint . --fix |
| `lint:fast` | biome check src tests |
| `test` | vitest run |
| `test:all` | playwright + safe-mode |
| `test:safe-mode` | VITE_SAFE_MODE=true playwright tests/smoke/safe-mode |
| `test:e2e` | playwright test |
| `test:e2e:ui` | playwright test --ui |
| `test:contracts` | vitest run tests/contracts |
| `test:visual` | percy exec -- playwright test |
| `format` | prettier --write . |
| `format:check` | prettier --check . |
| `typecheck` | tsc --noEmit |
| `check` | lint && build |
| `ship` | lint + typecheck + build + git add + commit + push |
| `dev:ios` | scripts/dev-ios.sh |
| `ios:fresh` | scripts/ios-fresh.sh |
| `ios:dev` | alias ios:fresh |
| `ios:live` | scripts/ios-live.sh |
| `ios:watch` | scripts/ios-watch.sh |
| `ios:clean` | rm dist, ios/App/App/public, DerivedData |
| `ios:sync` | build + cap sync ios |
| `ios:sync:dev` | build + CAPACITOR_USE_DEV_SERVER=true cap sync |
| `ios:open` | cap open ios |
| `ios:run` | scripts/ios-run.sh |
| `ios:run:dev` | CAPACITOR_USE_DEV_SERVER=true cap run ios |
| `supabase:migrate` | scripts/supabase-migrate.sh |
| `diagnose` | node scripts/diagnose-project.js |
| `storybook` | storybook dev -p 6006 |
| `audit:repo` | knip |
| `dev:safe` | VITE_SAFE_MODE=true vite |
| `env:guard` | scripts/environment-guard.sh |
| `pwa:validate` | node scripts/pwa-icon-validator.mjs |
| `supabase:redirect-urls` | node scripts/print-supabase-redirect-urls.js |
| `supabase:ensure-oauth-ios` | node scripts/ensure-oauth-redirect-ios.js |

---

## 6. Dependencies Summary

### Production (26)
- **Capacitor**: @capacitor/app, browser, cli, core, inappbrowser, ios, preferences, status-bar
- **UI**: @radix-ui/* (dialog, label, select, slider, slot, switch, tabs), class-variance-authority, clsx, tailwind-merge, tailwindcss-animate, lucide-react, framer-motion
- **Data**: @supabase/supabase-js, @tanstack/react-query
- **Map**: mapbox-gl
- **Utils**: ngeohash, date-fns
- **Core**: react, react-dom, react-router-dom
- **Monitoring**: @sentry/react
- **State**: zustand *(knip: unused)*

### Dev (32)
- **Lint/Format**: eslint, biome, prettier, lint-staged, husky
- **Test**: playwright, vitest, percy, @percy/playwright
- **Build**: vite, @vitejs/plugin-react, typescript
- **Storybook**: storybook, @storybook/*, @chromatic-com/storybook
- **Supabase**: supabase *(knip: unused)*
- **Other**: chokidar-cli *(knip: unused)*, eslint-plugin-react-refresh *(knip: unused)*, knip, pg, sharp

### Unlisted (geojson)
- Used in MapLayers.js, geojsonUtils.js, layers.js, realtimeCarUtils.js, waitMeCarLayer.js — add to package.json.

---

## 7. Problems Found (with file:line)

| Issue | Location | Severity |
|-------|---------|----------|
| **Duplicate processOAuthUrl** | `oauthCapture.js:18` and `App.jsx:16` — same logic, different callbacks | Medium |
| **Dual appUrlOpen listeners** | oauthCapture + App.jsx both register; can process same URL twice | Medium |
| **ALLOWED_PREFIXES vs allowed** | oauthCapture uses `ALLOWED_PREFIXES`; App uses inline `allowed` — should be shared | Low |
| **geojson not in package.json** | MapLayers, geojsonUtils, layers, realtimeCarUtils, waitMeCarLayer | Medium |
| **zustand unused** | package.json:93 | Low |
| **@capacitor/ios unused** | package.json:68 (likely used by cap sync) | Low |
| **Diagnostic UI in CreateAlertCard** | CreateAlertCard.jsx:151-166 — DEV-only diag block should be removed or gated | Low |
| **isPlaceholder duplicated** | supabaseClient.js:48, runtimeConfig.js:16 | Low |
| **PLACEHOLDERS duplicated** | supabaseClient.js:46, runtimeConfig.js:9 | Low |

---

## 8. Duplications

| Pattern | Files |
|---------|-------|
| **processOAuthUrl** | oauthCapture.js, App.jsx — nearly identical |
| **ALLOWED_PREFIXES / allowed** | oauthCapture.js:10, App.jsx:19 |
| **isPlaceholder / PLACEHOLDERS** | supabaseClient.js, runtimeConfig.js |
| **map.on('load') + setMapReady** | MapboxMap.jsx, ParkingMap.jsx, SellerLocationTracker.jsx |
| **createMap / mapboxgl.Map init** | MapboxMap (MapInit.createMap), ParkingMap, SellerLocationTracker — different patterns |

---

## 9. Dead Code (Knip)

### Unused files (11)
- `src/components/chat/ChatEmptyState.jsx`
- `src/components/demo/DemoFlowProvider.jsx`
- `src/components/history/HistoryEmpty.jsx`
- `src/components/historyBuyer/HistoryBuyerDialogs.jsx`
- `src/components/historySeller/HistorySellerDialogs.jsx`
- `src/components/profile/ProfileLogout.jsx`
- `src/lib/locationPipeline/index.js`
- `src/lib/mockOviedoAlerts.js`
- `src/lib/stripe/stripeService.js`
- `src/lib/vehicleIcons.js`
- `src/system/map/index.js`

### Unused exports (101)
- DemoFlowManager: isDemoMode, getDemoState, startDemoFlow, etc.
- HistoryItem: formatAddress, formatPriceInt, formatRemaining
- UI: badgeVariants, buttonVariants, DialogPortal, etc.
- location: normalizePositionForMapMatching, createLocationSmoother, checkLocationFraud, etc.
- transaction: getArrivalConfidenceLogs, logProximityEvent, etc.
- (Full list in `npm run audit:repo`)

---

## 10. Tests

### Structure
- **tests/smoke/** — load, create, diagnostics, safe-mode
- **tests/layout/** — map-layout, map-create
- **tests/visual/** — verify-ubicate-button, create-card-position, map-shell-unified
- **tests/validation/** — measure-layout-real
- **tests/contracts/** — vitest: locationEngine, locationPipeline, locationInitialFix, transactionEngine, chat, locationFraud, mockNavigateCars

### Playwright
- Port 5174 (or PLAYWRIGHT_PORT)
- Geolocation: Oviedo (configurable)
- CI: chromium only, retries 2, workers 1

### Vitest
- tests/contracts/**/*.test.js
- node environment

---

## 11. CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)
- **Triggers**: push/PR to main
- **Steps**: checkout, setup Node (.nvmrc), npm install, lint, typecheck, build
- **Secrets**: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

### Disabled workflows
- workflows_disabled/ci.yml
- workflows_disabled/supabase.yml
- workflows_disabled/codeql.yml

### Vercel
- `vercel.json`: framework vite, buildCommand npm run build, outputDirectory dist
- Rewrites: `/(.*)` → `/index.html`

### Missing
- No E2E in CI (playwright not run in GitHub Actions)
- No deploy step in CI (Vercel likely auto-deploys from repo)

---

## 12. Docs

- **docs/** — AUDITORIA_MAESTRA_WAITME.md, WAITME_AGENT_CONTEXT.md
- **docs/archive/** — ~80+ archived docs (audits, migrations, architecture)
- **docs/archive/quarantine/** — quarantined code/docs

---

## 13. .cursorignore / .gitignore

### .cursorignore
- node_modules, dist, coverage
- tests, playwright-report, test-results, snapshots
- .storybook, storybook-static
- supabase, ios
- scripts
- docs/archive, docs/archive/quarantine, quarantine
- tmp, .DS_Store

### .gitignore
- .env, .env.* (except .env.example, .env.local.example)
- logs, node_modules, dist, dist-ssr
- ios__backup*, DerivedData, *.xcworkspace, *.xcuserdata
- playwright-report, test-results
- .vscode/* (except extensions.json, tasks.json, launch.json, settings.json)
- .idea, .DS_Store
- *storybook.log, storybook-static, ios_run_last.log
- tmp/, tmp/*.zip

---

## 14. Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite, React, path alias @/, base ./, port 5173 |
| `tailwind.config.js` | Tailwind, dark mode, theme |
| `postcss.config.js` | tailwindcss, autoprefixer |
| `tsconfig.json` | ES2020, paths @/*, allowJs, noEmit |
| `eslint.config.js` | ESLint flat, React, Prettier, unused-imports |
| `playwright.config.js` | E2E, port 5174, geolocation |
| `capacitor.config.ts` | appId, webDir dist, server.url conditional |
| `turbo.json` | build, lint, typecheck, test tasks |
| `knip.json` | entry, project, ignore for dead code |
| `vercel.json` | Vite, rewrites SPA |
| `.percy.yml` | Visual regression widths |
| `.prettierrc` | Prettier |
| `.lintstagedrc.json` | Lint-staged |
| `biome.json` | Biome |
| `components.json` | shadcn/ui |
| `manifest.json` | PWA |
| `.nvmrc` | Node version |

---

## 15. Recommendations

1. **Unify OAuth handling**: Extract `processOAuthUrl` to a shared module; use single listener in oauthCapture (native) or App (web).
2. **Add geojson**: `npm install geojson` and add to package.json.
3. **Remove or use dead files**: Delete or integrate ChatEmptyState, HistoryEmpty, ProfileLogout, etc., or confirm they are intentionally kept.
4. **Run E2E in CI**: Add `npm run test:e2e` (or smoke subset) to GitHub Actions.
5. **Clean CreateAlertCard**: Remove or gate the DEV diagnostic block (lines 151-166).
6. **Share placeholder logic**: Move `isPlaceholder`/`PLACEHOLDERS` to a shared util used by supabaseClient and runtimeConfig.
7. **Review zustand**: Remove if unused, or document planned use.
