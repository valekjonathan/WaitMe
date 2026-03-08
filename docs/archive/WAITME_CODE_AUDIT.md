# WaitMe — Auditoría de Código

**Fecha:** 2026-03-06  
**Objetivo:** Detectar causas de pantalla blanca, código muerto, hooks sin uso, dependencias rotas, providers mal ubicados e inicializaciones peligrosas.

---

## PROJECT TREE

```
src/
├── App.jsx
├── Layout.jsx
├── main.jsx
├── index.css
├── globals.css
├── config/
│   └── alerts.js
├── core/
│   └── ErrorBoundary.jsx
├── data/
│   ├── alerts.js
│   ├── chat.js
│   ├── notifications.js
│   ├── profiles.js
│   ├── transactions.js
│   ├── uploads.js
│   └── userLocations.js
├── dev/
│   └── diagnostics.js
├── diagnostics/
│   ├── MissingEnvScreen.jsx
│   └── SafeModeShell.jsx
├── hooks/
│   ├── useMyAlerts.js
│   ├── useProfileGuard.ts
│   └── useRealtimeAlerts.js
├── lib/
│   ├── AuthContext.jsx
│   ├── LayoutContext.jsx
│   ├── alertSelectors.js
│   ├── alertsQueryKey.js
│   ├── finalizedAtStore.js
│   ├── geohash.js
│   ├── mockNearby.js
│   ├── mockOviedoAlerts.js
│   ├── profile.ts
│   ├── sentry.js
│   ├── supabaseClient.js
│   ├── transactionEngine.js
│   ├── utils.js
│   ├── vehicleIcons.js
│   └── waitmeRequests.js
├── pages/
│   ├── Chat.jsx
│   ├── Chats.jsx
│   ├── DevDiagnostics.jsx
│   ├── History.jsx
│   ├── HistoryBuyerView.jsx
│   ├── HistorySellerView.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Navigate.jsx
│   ├── NotificationSettings.jsx
│   ├── Notifications.jsx
│   ├── Profile.jsx
│   └── Settings.jsx
├── services/
│   ├── alertsSupabase.js
│   ├── chatSupabase.js
│   ├── notificationsSupabase.js
│   ├── profilesSupabase.js
│   ├── realtime/
│   │   └── alertsRealtime.js
│   ├── transactionsSupabase.js
│   ├── uploadsSupabase.js
│   └── userLocationsSupabase.js
├── state/
│   └── appStore.js
├── components/
│   ├── AddressAutocompleteInput.jsx
│   ├── BottomNav.jsx
│   ├── CenterPin.jsx
│   ├── CreateMapOverlay.jsx
│   ├── DemoFlowManager.jsx
│   ├── Header.jsx
│   ├── IncomingRequestModal.jsx
│   ├── Logo.jsx
│   ├── MapboxMap.jsx
│   ├── MapZoomControls.jsx
│   ├── SearchMapOverlay.jsx
│   ├── SellerLocationTracker.jsx
│   ├── StreetSearch.jsx
│   ├── WaitMeRequestScheduler.jsx
│   ├── cards/
│   │   ├── CreateAlertCard.jsx
│   │   ├── MarcoCard.jsx
│   │   └── UserAlertCard.jsx
│   ├── map/
│   │   ├── MapFilters.jsx
│   │   └── ParkingMap.jsx
│   └── ui/                    # 37 componentes shadcn (muchos no usados)
│       └── ...
└── utils/
    ├── carUtils.js
    └── index.ts
```

---

## UNUSED FILES

### Archivos no importados (Knip)

| Archivo | Notas |
|---------|-------|
| `src/hooks/useRealtimeAlerts.js` | Sacado de Layout; nadie lo usa. Cadena muerta con appStore.alerts |
| `src/services/realtime/alertsRealtime.js` | Solo usado por useRealtimeAlerts (muerto) |
| `src/state/appStore.js` | Solo usado por useRealtimeAlerts y alertsRealtime (ambos muertos) |
| `src/components/ui/sidebar.jsx` | Importa `@/hooks/use-mobile` que NO EXISTE en src (está en quarantine). Nunca importado. |
| `src/components/ui/accordion.jsx` | No importado |
| `src/components/ui/alert-dialog.jsx` | No importado |
| `src/components/ui/alert.jsx` | No importado |
| `src/components/ui/aspect-ratio.jsx` | No importado |
| `src/components/ui/avatar.jsx` | No importado |
| `src/components/ui/breadcrumb.jsx` | No importado |
| `src/components/ui/calendar.jsx` | No importado |
| `src/components/ui/card.jsx` | No importado |
| `src/components/ui/carousel.jsx` | No importado |
| `src/components/ui/chart.jsx` | No importado |
| `src/components/ui/checkbox.jsx` | No importado |
| `src/components/ui/collapsible.jsx` | No importado |
| `src/components/ui/command.jsx` | No importado |
| `src/components/ui/context-menu.jsx` | No importado |
| `src/components/ui/drawer.jsx` | No importado |
| `src/components/ui/dropdown-menu.jsx` | No importado |
| `src/components/ui/form.jsx` | No importado |
| `src/components/ui/hover-card.jsx` | No importado |
| `src/components/ui/input-otp.jsx` | No importado |
| `src/components/ui/menubar.jsx` | No importado |
| `src/components/ui/navigation-menu.jsx` | No importado |
| `src/components/ui/pagination.jsx` | No importado |
| `src/components/ui/popover.jsx` | No importado |
| `src/components/ui/progress.jsx` | No importado |
| `src/components/ui/radio-group.jsx` | No importado |
| `src/components/ui/resizable.jsx` | No importado |
| `src/components/ui/scroll-area.jsx` | No importado |
| `src/components/ui/separator.jsx` | No importado |
| `src/components/ui/sheet.jsx` | No importado |
| `src/components/ui/skeleton.jsx` | No importado |
| `src/components/ui/sonner.jsx` | No importado |
| `src/components/ui/table.jsx` | No importado |
| `src/components/ui/textarea.jsx` | No importado |
| `src/components/ui/toast.jsx` | No importado |
| `src/components/ui/toaster.jsx` | No importado |
| `src/components/ui/toggle-group.jsx` | No importado |
| `src/components/ui/toggle.jsx` | No importado |
| `src/components/ui/tooltip.jsx` | No importado |

---

## UNUSED HOOKS

| Hook | Ubicación | Estado |
|------|-----------|--------|
| `useRealtimeAlerts` | hooks/useRealtimeAlerts.js | No usado (sacado de Layout) |
| `useProfileFormData` | lib/LayoutContext.jsx | Exportado pero nunca importado |
| `use-mobile` (useIsMobile) | quarantine/hooks/ | Referenciado por sidebar.jsx pero archivo en quarantine; src/hooks/use-mobile no existe |

### Hooks usados correctamente

| Hook | Usado en |
|------|----------|
| `useAuth` | App, Layout children (Header, BottomNav, pages), useMyAlerts |
| `useMyAlerts` | History.jsx, BottomNav.jsx, Home.jsx |
| `useProfileGuard` | Home.jsx |
| `useLayoutHeader` | Home.jsx, Profile.jsx |
| `useLayoutHeaderConfig` | Layout.jsx (LayoutShell) |
| `useSetProfileFormData` | Profile.jsx |

---

## DUPLICATE LOGIC

### 1. Error handlers duplicados

- **`src/dev/diagnostics.js`** (primera importación en main.jsx): Define `window.__WAITME_DIAG__`, `window.onerror`, `window.onunhandledrejection`
- **`initErrorCapture()` en main.jsx**: Sobrescribe `__WAITME_DIAG__` con `{ errors: [], maxErrors: 10 }` y vuelve a asignar `onerror` y `addEventListener('unhandledrejection')`

**Riesgo:** Los handlers de diagnostics.js se pierden al ejecutarse initErrorCapture(). Orden de ejecución: diagnostics → initErrorCapture. El último gana.

### 2. appStore.alerts — cadena muerta

- `useRealtimeAlerts` escribía en `appStore.alerts`
- Nadie lee `appStore.alerts` (Home usa React Query nearbyAlerts)
- useRealtimeAlerts fue sacado de Layout → toda la cadena está muerta

---

## WHITE SCREEN RISKS

### 1. Componentes root que retornan null

- **Layout.jsx:** No retorna null; siempre retorna JSX.
- **App.jsx:** AuthRouter retorna `null` implícitamente solo si no hay children; en la práctica retorna Login, "Cargando...", o Layout.
- **main.jsx:** Si `rootEl` no existe, no hace render (solo log). Riesgo bajo.

### 2. MissingEnvScreen sin AuthProvider

- Cuando `getSupabaseConfig().ok === false`, se renderiza `MissingEnvScreen` dentro de `HashRouter` pero **sin AuthProvider**.
- MissingEnvScreen no usa useAuth → OK.

### 3. Mapbox inicialización

- **MapboxMap.jsx:** Mapbox se carga con `import('mapbox-gl')` dentro de `useEffect` (después del mount). Correcto.
- **ParkingMap.jsx:** `mapboxgl.accessToken` y `new mapboxgl.Map()` dentro de useEffect. Correcto.
- **SellerLocationTracker.jsx:** Idem. Correcto.
- **StreetSearch.jsx:** Usa Mapbox Geocoding API vía fetch; no inicializa GL. OK.

### 4. Zustand / appStore

- `appStore` se usa solo en useRealtimeAlerts y alertsRealtime (ambos muertos).
- Zustand se inicializa al importar; no hay uso antes de mount en el flujo activo.

### 5. AuthProvider

- AuthProvider envuelve correctamente a HashRouter > QueryClientProvider > App.
- Todos los componentes que usan useAuth están dentro del árbol de AuthProvider (cuando config.ok).

### 6. Imports dinámicos

- `import('./lib/sentry').catch(() => {})` — tiene catch. OK.
- `import('mapbox-gl')` en MapboxMap — dentro de useEffect, con manejo de error. OK.
- `lazy()` para páginas — Suspense con fallback={null}. Riesgo: fallback vacío puede dar flash blanco breve.

### 7. Suspense fallback

- Layout usa `<Suspense fallback={null}>` para Outlet. Si una ruta lazy tarda, se ve nada hasta que carga. Posible flash blanco.

### 8. Dependencia rota: sidebar → use-mobile

- `sidebar.jsx` importa `@/hooks/use-mobile` (useIsMobile).
- `src/hooks/use-mobile` no existe (archivo en quarantine).
- **sidebar.jsx no está importado en ningún sitio** → no rompe el build. Si en el futuro se usa Sidebar, fallará.

---

## DEPENDENCY GRAPH

```
main.jsx
├── ./dev/diagnostics
├── React, ReactDOM
├── HashRouter
├── QueryClient, QueryClientProvider
├── AuthProvider (lib/AuthContext)
├── getSupabaseConfig (lib/supabaseClient)
├── App
├── ErrorBoundary (core/ErrorBoundary)
├── MissingEnvScreen
├── SafeModeShell
└── import('./lib/sentry')

App.jsx
├── Layout
├── Login
├── DemoFlowManager
├── WaitMeRequestScheduler
├── IncomingRequestModal
├── useAuth
└── getSupabase

Layout.jsx
├── LayoutProvider, useLayoutHeaderConfig (LayoutContext)
├── Header
├── BottomNav
├── Home
└── lazy: Chats, Chat, Notifications, NotificationSettings, Profile, Settings, History, Navigate, DevDiagnostics

Home.jsx
├── MapboxMap
├── CreateMapOverlay
├── SearchMapOverlay
├── useAuth, useProfileGuard, useMyAlerts
├── useLayoutHeader
├── data/alerts, data/chat, data/notifications, data/transactions
├── lib/mockOviedoAlerts, lib/alertSelectors, lib/alertsQueryKey
└── ...

pages → components → hooks → data → services
```

---

## CRITICAL RISKS

### 1. Conflicto diagnostics vs initErrorCapture

**Riesgo:** `diagnostics.js` define handlers; `initErrorCapture()` los sobrescribe. Diagnóstico global puede no comportarse como se espera.

**Acción:** Unificar en un solo sistema de captura de errores o definir orden/prioridad claro.

### 2. Suspense fallback={null}

**Riesgo:** Rutas lazy sin fallback visible → pantalla en blanco hasta que carguen Chats, Chat, Notifications, etc.

**Acción:** Considerar fallback con spinner o skeleton mínimo.

### 3. use-mobile ausente

**Riesgo:** Si se usa `sidebar.jsx` en el futuro, el build fallará por import a `@/hooks/use-mobile` inexistente.

**Acción:** Restaurar `use-mobile` en src/hooks o eliminar dependencia en sidebar.

### 4. Cadena appStore / useRealtimeAlerts / alertsRealtime

**Riesgo:** Código muerto. No provoca pantalla blanca pero añade ruido y confusión.

**Acción:** Eliminar o reubicar useRealtimeAlerts si se quiere Realtime de alertas en alguna pantalla concreta.

### 5. Capacitor OAuth sin catch completo

**Riesgo:** En App.jsx, `CapacitorApp.addListener(...).then((s) => (sub = s))` no tiene .catch. Si falla, sub puede quedar undefined y `sub?.remove?.()` podría no limpiar.

**Acción:** Añadir .catch al addListener.

---

## SAFE CLEANUP PLAN

### Fase 1 — Estabilizar providers

1. Confirmar árbol: ErrorBoundary > AuthProvider > HashRouter > QueryClientProvider > App.
2. MissingEnvScreen correctamente fuera de AuthProvider (no usa useAuth).
3. SafeModeShell tiene su propio AuthProvider interno.

### Fase 2 — Estabilizar hooks

1. Decidir qué hacer con `useRealtimeAlerts`: eliminar o mover a Home/History.
2. Eliminar o usar `useProfileFormData` (actualmente no usado).
3. Restaurar `use-mobile` en src/hooks si se va a usar Sidebar, o eliminar import en sidebar.

### Fase 3 — Limpiar código muerto

1. Eliminar o archivar: useRealtimeAlerts, alertsRealtime, appStore (si se confirma que no hay consumidores).
2. Mover componentes ui no usados a carpeta `_unused` o excluirlos del bundle.
3. Revisar dependencias npm no usadas (knip reporta 35).

### Fase 4 — Aislar mapa

1. Mantener MapboxMap, ParkingMap, SellerLocationTracker con inicialización lazy en useEffect.
2. No tocar Home.jsx (protegido).
3. Documentar flujo de token Mapbox y manejo de errores.

### Fase 5 — Preparar arquitectura

1. Unificar sistema de diagnóstico (diagnostics.js vs initErrorCapture).
2. Añadir fallback visible a Suspense en Layout.
3. Revisar y cerrar promesas sin catch en App.jsx (Capacitor).

---

## quarantine/

Contenido actual (solo listado):

```
quarantine/
├── README.md
├── pages.config.js
├── components/
│   ├── ActiveAlertCard.jsx
│   ├── ErrorBoundary.jsx
│   ├── UserNotRegisteredError.jsx
├── hooks/
│   ├── use-mobile.jsx
│   ├── useAlertsQuery.js
│   ├── useDebouncedSave.js
│   ├── useMapMatch.js
├── lib/
│   ├── PageNotFound.jsx
│   ├── logger.js
│   ├── maps/
│   │   ├── carUtils.js
│   │   ├── mapConstants.js
│   │   └── mapMarkers.js
│   ├── query-client.js
└── services/
    └── alertService.js
```

---

*Auditoría generada sin modificar código. Seguir SAFE_CHANGE_PROTOCOL.md antes de aplicar cambios.*
