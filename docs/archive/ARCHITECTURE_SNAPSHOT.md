# WaitMe — Architecture Snapshot

Documentación de la arquitectura actual del repositorio. **No modifica código**; solo describe el estado existente.

---

## 1. PROJECT STRUCTURE

| Folder | Purpose |
|--------|---------|
| **src/** | Código fuente principal de la aplicación |
| **src/api/** | Cliente Base44, entidades, integraciones |
| **src/components/** | Componentes UI (cards, map, primitivos) |
| **src/components/map/** | ParkingMap, MapFilters |
| **src/components/cards/** | CreateAlertCard, UserAlertCard, ActiveAlertCard, MarcoCard |
| **src/hooks/** | useMyAlerts, useRealtimeAlerts, useAlertsQuery, useMapMatch, useProfileGuard, useDebouncedSave |
| **src/lib/** | AuthContext, LayoutContext, supabaseClient, finalizedAtStore, geohash, profile, logger, sentry, alertSelectors |
| **src/pages/** | Home, History, HistorySellerView, HistoryBuyerView, Chat, Chats, Navigate, Login, Profile, Settings, Notifications, NotificationSettings |
| **src/services/** | alertService (Supabase), realtime/alertsRealtime |
| **src/state/** | appStore (Zustand) |
| **src/utils/** | carUtils, index.ts |
| **src/diagnostics/** | MissingEnvScreen |
| **supabase/** | config.toml, migrations, functions (map-match) |
| **docs/** | Auditorías, planes de migración, DB_SETUP, etc. |
| **scripts/** | supabase-migrate.sh, run-profile-migration.mjs, ios-run.sh, ship.sh |
| **ios/** | App Capacitor iOS (CapApp-SPM, AppDelegate, assets) |
| **tests/** | Playwright specs (app, map, profile) |
| **.github/workflows/** | lint-and-build, tests, supabase-migrations |

---

## 2. ENTRY POINTS

| File | Role |
|------|------|
| **index.html** | Shell HTML |
| **src/main.jsx** | Raíz: Sentry, HashRouter, QueryClientProvider, AuthProvider, App. Si faltan envs de Supabase → MissingEnvScreen |
| **src/App.jsx** | AuthRouter (Login vs Layout), manejo OAuth URL (Capacitor), DemoFlowManager, WaitMeRequestScheduler, IncomingRequestModal |
| **src/Layout.jsx** | LayoutProvider, useRealtimeAlerts, Routes, Header, BottomNav, lazy-loaded pages |

**Providers (orden de anidación):**
1. ErrorBoundary
2. HashRouter
3. QueryClientProvider
4. AuthProvider
5. LayoutProvider (dentro de Layout)

**Routing (react-router-dom v6):**

| Path | Component |
|------|-----------|
| `/`, `/home`, `/Home` | Home |
| `/chats` | Chats |
| `/chat`, `/chat/:id` | Chat |
| `/notifications` | Notifications |
| `/notification-settings` | NotificationSettings |
| `/profile` | Profile |
| `/settings` | Settings |
| `/history`, `/alertas` | History (Alertas) |
| `/navigate` | Navigate |

No hay ruta 404 configurada. Existe `PageNotFound.jsx` pero no está usada en las rutas.

---

## 3. STATE MANAGEMENT

| Type | Location | Contents |
|------|----------|----------|
| **AuthContext** | `src/lib/AuthContext.jsx` | user, profile, isAuthenticated, isLoadingAuth, authError, checkUserAuth |
| **LayoutContext** | `src/lib/LayoutContext.jsx` | Config del header (title, backButton, backTo, onBack, titleClassName) |
| **Zustand (appStore)** | `src/state/appStore.js` | auth.user, profile, alerts.items, alerts.loading, location (lat/lng/accuracy), ui.error |
| **finalizedAtStore** | `src/lib/finalizedAtStore.js` | localStorage `waitme:finalized_at_map` para timestamps de finalización |
| **React Query** | TanStack Query | myAlerts, myTransactions, conversation, chatMessages, unreadCount, etc. |

**Contextos UI (Radix):** FormFieldContext, FormItemContext, SidebarContext, CarouselContext, ToggleGroupContext, ChartContext.

---

## 4. DATA SOURCES

| Source | Client/Config | Usage |
|--------|---------------|-------|
| **Supabase** | `src/lib/supabaseClient.js` (lazy init) | Auth, profiles, parking_alerts, Realtime |
| **Base44** | `src/api/base44Client.js` | ParkingAlert, Conversation, ChatMessage, Transaction, Notification, auth.me |
| **Mapbox** | `mapbox-gl`, `VITE_MAPBOX_TOKEN` | MapboxMap, ParkingMap, Edge Function map-match |
| **Nominatim** | `https://nominatim.openstreetmap.org/reverse` | Reverse geocoding (Home.jsx) |
| **Supabase Edge Function** | `supabase/functions/map-match/index.ts` | Mapbox Map Matching API (MAPBOX_SECRET_TOKEN) |

---

## 5. REALTIME FLOWS

| Flow | Location | Mechanism |
|------|----------|------------|
| **Parking alerts** | `src/services/realtime/alertsRealtime.js`, `src/hooks/useRealtimeAlerts.js` | Supabase channel `parking_alerts_realtime`, postgres_changes (INSERT/UPDATE/DELETE) en `public.parking_alerts` |
| **Auth state** | `src/lib/AuthContext.jsx` | `supabase.auth.onAuthStateChange` |
| **Chat messages** | `src/pages/Chat.jsx` | `base44.entities.ChatMessage.subscribe` |
| **Polling (1s)** | History.jsx, Chats.jsx, IncomingRequestModal.jsx | `setInterval(() => setNowTs(Date.now()), 1000)` para countdowns |
| **Map match** | `src/hooks/useMapMatch.js` | `setInterval(runMatch, MATCH_INTERVAL_MS)` |
| **Demo flow** | `src/components/DemoFlowManager.jsx` | `setInterval(notify, 1000)`, `subscribeDemoFlow` |
| **Navigate animation** | `src/pages/Navigate.jsx` | `setInterval(moveTowardsDestination, 400)` |

---

## 6. MAP SYSTEM

| Component | File | Data source | Role |
|-----------|------|-------------|------|
| **MapboxMap** | `src/components/MapboxMap.jsx` | useAppStore (alerts.items, location) | Mapa de fondo en Home, clusters, marcador de usuario |
| **ParkingMap** | `src/components/map/ParkingMap.jsx` | Props (alerts, userLocation, sellerLocation, etc.) | Mapa de búsqueda/creación, rutas, marcadores |
| **MapFilters** | `src/components/map/MapFilters.jsx` | Props | Filtros de precio/distancia |
| **SellerLocationTracker** | `src/components/SellerLocationTracker.jsx` | Base44 ParkingAlert, UserLocation | Ubicación en vivo del vendedor en Navigate |

**Mapbox:** `VITE_MAPBOX_TOKEN`; import dinámico en MapboxMap, estático en ParkingMap.

---

## 7. ALERT SYSTEM

| Layer | File(s) | Role |
|-------|---------|------|
| **CRUD (Base44)** | Home.jsx, History.jsx, IncomingRequestModal, ActiveAlertCard, etc. | Crear/actualizar/eliminar vía `base44.entities.ParkingAlert` |
| **CRUD (Supabase)** | `src/services/alertService.js` | createAlert, getActiveAlerts, getActiveAlertsNear, reserveAlert, closeAlert |
| **Realtime** | `src/services/realtime/alertsRealtime.js`, `src/hooks/useRealtimeAlerts.js` | Supabase Realtime → appStore alerts |
| **Query hooks** | `useMyAlerts.js` (Base44), `useAlertsQuery.js` (alertService) | Fetch y cache de alertas |
| **History.jsx** | `src/pages/History.jsx` | UI principal de alertas: Activas/Finalizadas, Reservas, countdowns, cancelar/expirar/repetir |
| **HistorySellerView** | `src/pages/HistorySellerView.jsx` | Vista vendedor (alertas propias) |
| **HistoryBuyerView** | `src/pages/HistoryBuyerView.jsx` | Vista comprador (reservas) |

**History.jsx specifics:**
- Usa `useMyAlerts` (Base44) para datos
- `finalizedAtStore` para orden de finalizadas
- `alertSelectors` (getActiveSellerAlerts, getBestFinalizedTs)
- localStorage: `waitme:thinking_requests`, `waitme:rejected_requests`, `waitme:hidden_keys`, `alert-created-{id}`
- Custom events: `waitme:thinkingUpdated`, `waitme:rejectedUpdated`, `waitme:badgeRefresh`

---

## 8. CHAT SYSTEM

| Component | File | Data source |
|-----------|------|-------------|
| **Chats** | `src/pages/Chats.jsx` | Base44 Conversation, ParkingAlert, Notification |
| **Chat** | `src/pages/Chat.jsx` | Base44 Conversation, ChatMessage, auth.me; DemoFlowManager para demo |
| **IncomingRequestModal** | `src/components/IncomingRequestModal.jsx` | Base44 ParkingAlert, Conversation, ChatMessage |

**Flujo chat:** Base44 `Conversation.filter`, `ChatMessage.filter/create/update`, `ChatMessage.subscribe` para realtime. `UploadFile` para adjuntos.

---

## 9. SOURCE OF TRUTH

| Domain | Source of truth | Notes |
|--------|-----------------|-------|
| **Auth** | Supabase Auth | AuthContext, Login OAuth |
| **Profiles** | Supabase `profiles` | AuthContext, Profile.jsx; NotificationSettings aún usa base44.auth.updateMe |
| **Alerts** | Dual | Base44 para CRUD (Home, History); Supabase para Realtime + appStore; alertService existe pero no es el flujo principal |
| **Chat** | Base44 | Conversation, ChatMessage |
| **Maps** | Dual | MapboxMap: appStore (Supabase Realtime); ParkingMap: props (Base44/demo) |
| **Transactions** | Base44 | Navigate.jsx, History.jsx |
| **Notifications** | Base44 | Notifications.jsx, NotificationSettings.jsx |

---

## 10. DUPLICATIONS

| Duplication | Details |
|-------------|---------|
| **Alerts dual** | `useMyAlerts` (Base44) vs `useRealtimeAlerts` (Supabase → appStore). Home/History usan Base44; MapboxMap usa appStore. |
| **alertService poco usado** | `alertService.js` y `useAlertsQuery.js` apuntan a Supabase pero no son el flujo principal. |
| **User/profile** | AuthContext (user, profile) vs appStore (auth.user, profile); appStore.profile no se usa como fuente principal. |
| **Map components** | MapboxMap (Zustand) vs ParkingMap (props); distintas fuentes de datos y casos de uso. |
| **Query keys** | `alertsKey`/`alertsPrefix` (lib/alertsQueryKey) vs `alertsKeys` (useAlertsQuery) |
| **formatAddress / colores coche** | Helpers similares en History.jsx, IncomingRequestModal.jsx, ParkingMap.jsx |
| **Demo vs real** | DemoFlowManager (localStorage) vs Base44; lógica dividida en Chat, Chats, History |

---

*Documento generado a partir del escaneo del repositorio. No modifica código.*
