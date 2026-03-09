# WaitMe — Auditoría Total Entorno y App

**Fecha:** Marzo 2026  
**Alcance:** Código, entorno de desarrollo, automatización, herramientas  
**Objetivo:** Diagnóstico exhaustivo hasta nivel Uber/Stripe/Cabify/Glovo

---

## 1. DIAGNÓSTICO GENERAL

### Estado real del proyecto

| Área | Estado | Nota |
|------|--------|------|
| **Arquitectura** | 6/10 | React + Vite + Supabase + Mapbox + Capacitor. Estructura coherente pero duplicaciones y código muerto. |
| **Auth/OAuth** | 5/10 | Flujo implementado, doble manejo (oauthCapture + App), persistencia con Preferences. Login iOS sigue fallando en algunos casos. |
| **Mapa/Ubícate** | 6/10 | ensureMapController con retry, diagnóstico. Race en iOS Simulator (map.on('load') no fiable). |
| **iOS/Capacitor** | 7/10 | ios-fresh, ios-live, ios-watch, limpieza server.url. Falta E2E en Simulator. |
| **Automatización** | 6/10 | Scripts npm amplios, CI sin E2E, ship no automatizado en pre-push. |
| **Tests** | 5/10 | Playwright, Vitest, Percy. Smoke tests básicos. Sin E2E en CI. |
| **Observabilidad** | 4/10 | __WAITME_DIAG__, logs temporales. Sin APM, sin métricas. |
| **Seguridad** | 6/10 | Env vars, Supabase RLS. Tokens en secrets. |
| **Deuda técnica** | 7/10 | 11 archivos huérfanos, 101 exports no usados. Duplicaciones. |

### Estado real del entorno

- **Cursor:** .cursorignore excluye ios, scripts, tests, archive — reduce contexto para el agente.
- **Scripts:** 40+ scripts npm; muchos redundantes (ios:dev = ios:fresh, ios:run vs ios:run:dev).
- **Herramientas:** ESLint + Biome + Prettier; Knip; Storybook; Percy; Playwright; Vitest.
- **Flujo diario:** dev → ios:fresh/ios:live → manual. No hay "one command" para desarrollo completo.

---

## 2. PROBLEMAS ENCONTRADOS

### CRÍTICO

| # | Problema | Ubicación | Causa raíz |
|---|----------|-----------|------------|
| 1 | **Login iOS vuelve a login** | AuthContext, oauthCapture, supabaseClient | Posible race: appUrlOpen/getLaunchUrl pueden no llegar antes de que App monte; o Capacitor no bridgea la URL en iOS. Doble listener puede causar procesamiento duplicado. |
| 2 | **Ubícate no funciona en iOS Simulator** | MapboxMap, CreateAlertCard | map.on('load') no es fiable en iOS Simulator; window.waitmeMap puede no existir cuando se pulsa Ubícate. Retry existente pero puede no ser suficiente. |
| 3 | **CI sin E2E** | .github/workflows/ci.yml | Lint, typecheck, build. No ejecuta Playwright. Regresiones no detectadas automáticamente. |

### ALTO

| # | Problema | Ubicación |
|---|----------|-----------|
| 4 | Duplicación processOAuthUrl | oauthCapture.js, App.jsx |
| 5 | Doble appUrlOpen + getLaunchUrl | oauthCapture + App.jsx — mismo URL procesado dos veces |
| 6 | 11 archivos huérfanos | ChatEmptyState, HistoryEmpty, ProfileLogout, etc. |
| 7 | 101 exports no usados | Knip audit:repo |
| 8 | Scripts iOS redundantes | ios:dev=ios:fresh; ios:run vs ios:run:dev vs ios:live |
| 9 | Diagnostic block en CreateAlertCard | Líneas 151-166; en DEV siempre visible |

### MEDIO

| # | Problema | Ubicación |
|---|----------|-----------|
| 10 | isPlaceholder/PLACEHOLDERS duplicados | supabaseClient.js, runtimeConfig.js |
| 11 | ALLOWED_PREFIXES vs allowed | oauthCapture, App.jsx — no compartido |
| 12 | zustand en deps, no usado | package.json |
| 13 | .cursorignore excluye scripts | Agente no ve scripts al buscar |
| 14 | Workflows deshabilitados | .github/workflows_disabled/ |
| 15 | geojson: JSDoc usa import('geojson') | mapLayers; @types/geojson viene de mapbox-gl |

### BAJO

| # | Problema | Ubicación |
|---|----------|-----------|
| 16 | Logs temporales en producción | supabaseClient, App.jsx, oauthCapture |
| 17 | turbo.json presente pero no usado | No hay turbo en scripts |
| 18 | ~80 docs en archive | docs/archive/ |
| 19 | Maestro/Percy no en CI | test:visual manual |

---

## 3. DUPLICACIONES

| Patrón | Archivos |
|--------|----------|
| processOAuthUrl | oauthCapture.js, App.jsx |
| ALLOWED_PREFIXES / allowed | oauthCapture.js:10, App.jsx:19 |
| isPlaceholder / PLACEHOLDERS | supabaseClient.js, runtimeConfig.js |
| map.on('load') + setMapReady | MapboxMap, ParkingMap, SellerLocationTracker |
| createMap / mapboxgl.Map init | MapInit, ParkingMap, SellerLocationTracker |

---

## 4. DEUDA TÉCNICA

- **Archivos huérfanos:** 11 (ChatEmptyState, DemoFlowProvider, HistoryEmpty, HistoryBuyerDialogs, HistorySellerDialogs, ProfileLogout, locationPipeline/index, mockOviedoAlerts, stripeService, vehicleIcons, system/map/index)
- **Exports no usados:** 101 (Knip)
- **Código duplicado:** ~5 patrones principales
- **Configuraciones duplicadas:** eslint + biome; lint + lint:fast

---

## 5. RIESGOS Y FRAGILIDAD

- **Auth:** Si Capacitor no bridgea URL en iOS, el login falla silenciosamente.
- **Mapa:** Dependencia de map.on('load') en iOS Simulator.
- **Server.url:** ios-fresh elimina server; pero ios:live puede dejar config sucia si el proceso se mata.
- **CI:** Sin E2E, regresiones pasan a producción.

---

## 6. AUTOMATIZACIONES ACTUALES

| Automatización | Estado |
|----------------|--------|
| ios:fresh | ✓ Limpia, build, sync, elimina server.url, instala |
| ios:live | ✓ Dev server + live reload; cleanup al salir |
| ios:watch | ✓ chokidar + rebuild + sync + restart |
| ios:clean | ✓ rm dist, public, DerivedData |
| cap sync | ✓ Elimina server.url en runtime config |
| Lint-staged | ✓ Prettier + ESLint en pre-commit |
| Husky | ✓ prepare |
| CI | ✓ Lint, typecheck, build |

---

## 7. AUTOMATIZACIONES QUE FALTAN

- E2E en CI (Playwright)
- Pre-push: lint + typecheck + build + test smoke
- Comando único "dev:ios:full" = ios:fresh + opcional live
- Auto-restore de config si ios:live se mata
- Diagnóstico de auth en runtime (similar a __WAITME_DIAG__)
- Logs estructurados (no console.log dispersos)
- Health check de Supabase al arrancar

---

## 8. HERRAMIENTAS QUE SOBRAN

- **Biome** si ESLint ya cubre todo (lint vs lint:fast)
- **turbo.json** si no se usa Turborepo
- **Scripts redundantes:** ios:dev, ios:run:dev, ios:sync:dev — consolidar

---

## 9. HERRAMIENTAS QUE FALTAN

- E2E en CI
- Error monitoring (Sentry configurado pero no verificado)
- APM / métricas de rendimiento
- Script de validación pre-push completo

---

## 10. ARQUITECTURA ACTUAL

```
┌─────────────────────────────────────────────────────────────────┐
│ main.jsx → initOAuthCapture() → AuthProvider → App → AuthRouter  │
├─────────────────────────────────────────────────────────────────┤
│ Layout (Home, History, Profile, Chats, Notifications)            │
├─────────────────────────────────────────────────────────────────┤
│ MapboxMap (MapInit, MapLayers, MapEvents, MapControls)          │
├─────────────────────────────────────────────────────────────────┤
│ Services: alertsSupabase, profilesSupabase, chat, transactions  │
├─────────────────────────────────────────────────────────────────┤
│ Stores: carsMovementStore, finalizedAtStore                      │
├─────────────────────────────────────────────────────────────────┤
│ Lib: AuthContext, supabaseClient, location, mapLayers            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. ARQUITECTURA RECOMENDADA

- Unificar OAuth en un solo módulo (oauthCapture o App, no ambos)
- Extraer constantes compartidas (ALLOWED_PREFIXES, PLACEHOLDERS)
- Eliminar archivos huérfanos o documentar por qué se mantienen
- Añadir E2E en CI
- Reducir scripts npm redundantes
- Gatear logs de diagnóstico (solo VITE_DEBUG_OAUTH o similar)

---

## 12. DIAGNÓSTICO FINAL LOGIN iOS

### Causa raíz

1. **Doble manejo de OAuth:** oauthCapture.js y App.jsx registran ambos appUrlOpen y getLaunchUrl. Si uno procesa antes que el otro, puede haber race. Si el evento se dispara antes de que React monte, oauthCapture lo captura; si después, App.jsx. El flag `window.__WAITME_OAUTH_COMPLETE` intenta cubrir el caso "antes de App".

2. **Capacitor iOS conocido:** appUrlOpen/getLaunchUrl pueden no llegar en algunos escenarios (cold start, universal links). Custom scheme (com.waitme.app://) suele funcionar mejor.

3. **Persistencia:** Capacitor Preferences ya configurado. Si el exchange falla silenciosamente, no hay sesión.

4. **Posible fix:** Unificar en un solo handler; registrar en main.jsx lo antes posible; añadir logs para confirmar si la URL llega.

---

## 13. DIAGNÓSTICO FINAL UBÍCATE / MAPA

### Causa raíz

1. **map.on('load') no fiable en iOS Simulator:** WebGL/Mapbox en Simulator puede retrasar el evento. ensureMapController se llama en varios puntos + retry cada 100ms hasta 30 veces.

2. **Race:** Usuario pulsa Ubícate antes de que waitmeMap exista → locateFailureReason = "controller not ready".

3. **Palito:** UserLocationLayer usa coordinates [lng, lat]. CenterPin se posiciona con CSS. Si el mapa no está centrado, el centro visual no coincide con el GPS.

4. **Posible fix:** Aumentar retries; deshabilitar Ubícate hasta controllerReady; o usar fallback con mapRef.current si existe.

---

## 14. DIAGNÓSTICO FINAL iOS / SIMULATOR / CAPACITOR

**Estado:** Bueno. ios-fresh limpia server.url, instala build empaquetada. ios:live con live reload. ios:watch para rebuild automático.

**Falta:** E2E en Simulator. Comando único "dev" que elija el flujo. Verificación automática de que la app no tiene pantalla blanca.

---

## 15. PLAN DE LIMPIEZA PROFESIONAL

1. Unificar OAuth (oauthCapture + App → uno solo)
2. Eliminar archivos huérfanos o documentar
3. Eliminar exports no usados (Knip)
4. Consolidar scripts npm
5. Eliminar logs temporales o gatearlos
6. Añadir E2E a CI
7. Revisar .cursorignore (incluir scripts si el agente debe modificarlos)

---

## 16. PLAN DE AUTOMATIZACIÓN MÁXIMA

1. Pre-push: lint + typecheck + build + test smoke
2. CI: + playwright test (smoke)
3. ios:one = ios:fresh + opcional live
4. Health check Supabase en boot
5. Logs estructurados

---

## 17. LISTA PRIORIZADA DE PROBLEMAS

### CRÍTICO
- Login iOS vuelve a login
- Ubícate no funciona en iOS Simulator
- CI sin E2E

### ALTO
- Duplicación processOAuthUrl
- Doble listener OAuth
- 11 archivos huérfanos
- 101 exports no usados
- Scripts iOS redundantes
- Diagnostic block en CreateAlertCard

### MEDIO
- isPlaceholder duplicado
- ALLOWED_PREFIXES no compartido
- zustand no usado
- .cursorignore excluye scripts
- Workflows deshabilitados

### BAJO
- Logs temporales en prod
- turbo.json no usado
- docs/archive extenso
- Percy no en CI

---

## 18. PLAN DE ACCIÓN PROFESIONAL (ORDEN EXACTO)

1. Unificar OAuth: extraer processOAuthUrl a lib/oauthProcess.js; usar solo en oauthCapture (native) o App (web)
2. Eliminar doble listener: mantener solo oauthCapture para native
3. Añadir E2E smoke a CI
4. Eliminar archivos huérfanos (o mover a archive)
5. Ejecutar knip --fix para exports no usados
6. Consolidar scripts: ios:dev, ios:run:dev → documentar o eliminar
7. Gatear logs: VITE_DEBUG_OAUTH, import.meta.env.DEV
8. Eliminar diagnostic block CreateAlertCard o gatearlo
9. Compartir ALLOWED_PREFIXES, PLACEHOLDERS
10. Revisar .cursorignore
11. Eliminar turbo.json si no se usa
12. Validar Sentry
13. Añadir health check Supabase
14. Pre-push hook completo
