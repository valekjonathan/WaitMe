# WaitMe — Technical Audit

Análisis técnico del repositorio. **No modifica código**; solo documenta hallazgos.

---

## 1. PERFORMANCE

### Unnecessary re-renders

| Location | Issue |
|----------|------|
| **Layout.jsx** | `useRealtimeAlerts()` corre en Layout; cada cambio en appStore.alerts re-renderiza Layout y todos los hijos (Routes, Header, BottomNav). |
| **MapboxMap.jsx** | `useAppStore((s) => s.alerts.items)` — cualquier upsert/remove re-renderiza MapboxMap y recalcula GeoJSON. |
| **Home.jsx** | Muchos `useState` (mode, selectedAlert, userLocation, filters, etc.); cambios frecuentes propagan re-renders a ParkingMap, MapFilters, CreateAlertCard. |
| **History.jsx** | `nowTs` actualizado cada 1s vía `setInterval` → re-render completo de History + HistorySellerView/HistoryBuyerView cada segundo. |
| **Chats.jsx** | Igual: `setNowTs(Date.now())` cada 1s. |
| **IncomingRequestModal.jsx** | Polling 1s para countdown. |

### Heavy components

| Component | Notes |
|-----------|-------|
| **History.jsx** | ~1500+ líneas, múltiples subvistas, lógica de alertas, localStorage, eventos custom. |
| **Home.jsx** | ~980+ líneas, múltiples modos (search/create), mapas, mutaciones, queries. |
| **Chats.jsx** | Lógica demo + real, conversaciones, notificaciones. |
| **ParkingMap.jsx** | Inicializa Mapbox, markers, rutas OSRM, múltiples `useEffect`. |
| **MapboxMap.jsx** | Mapbox + geolocation watch + clusters. |

### Expensive hooks

| Hook | Cost |
|------|------|
| **useRealtimeAlerts** | Fetch inicial + suscripción Supabase; corre en Layout (siempre montado). |
| **useMapMatch** | `setInterval` 5s, acumula puntos GPS, llama Edge Function. |
| **useMyAlerts** | Base44 `ParkingAlert.filter`; usado en Home, History, BottomNav. |
| **useProfileGuard** | Depende de profile; puede bloquear render. |

### Polling intervals

| Location | Interval | Purpose |
|----------|----------|---------|
| **History.jsx** | 1000 ms | `nowTs` para countdowns |
| **Chats.jsx** | 1000 ms | `nowTs` para countdowns |
| **IncomingRequestModal.jsx** | 1000 ms | Countdown de petición |
| **useMapMatch.js** | 5000 ms | Map matching GPS |
| **DemoFlowManager.jsx** | 1000 ms | `notify()` a listeners (cuando `startDemoFlow` está activo) |
| **Navigate.jsx** | 400 ms | Animación `moveTowardsDestination` |
| **Home.jsx** (unreadCount) | 15000 ms | Refetch notificaciones no leídas |

---

## 2. STATE MANAGEMENT

### Duplicated states

| State | Locations | Conflict |
|-------|-----------|----------|
| **User / profile** | AuthContext (user, profile) vs appStore (auth.user, profile) | appStore.profile no se usa como fuente principal; AuthContext es la real. |
| **Alerts** | appStore.alerts (Supabase Realtime) vs React Query `['myAlerts']` (Base44) vs `alertsKey(mode, locationKey)` (mock) | Tres fuentes distintas. |
| **Location** | appStore.location vs `userLocation` local en Home/History/Navigate | MapboxMap usa appStore; ParkingMap recibe props. |

### Conflicting sources of truth

| Domain | Primary | Secondary | Problem |
|--------|---------|-----------|---------|
| **Alerts** | Base44 (CRUD) | Supabase (Realtime → appStore) | MapboxMap muestra appStore; History/Home usan Base44. Datos pueden divergir. |
| **My alerts** | React Query `['myAlerts']` (Base44) | — | Badge y lista usan esto; Realtime no actualiza myAlerts. |
| **Nearby alerts (search)** | `getMockNearbyAlerts` (mock local) | — | Home en modo search usa mock, no Supabase ni Base44. |

### Contexts vs Zustand misuse

| Store | Use case | Issue |
|-------|----------|-------|
| **AuthContext** | user, profile, auth state | Correcto; fuente única de auth. |
| **LayoutContext** | Header config | Correcto. |
| **appStore** | alerts, location, ui.error | alerts se llenan por Realtime pero History/Home no los usan para CRUD; location se usa en MapboxMap pero Home tiene su propio userLocation. |
| **finalizedAtStore** | localStorage para orden finalizadas | Fuera de React; OK. |

---

## 3. REALTIME

### Supabase realtime subscriptions

| Subscription | Location | Table | Events | Cleanup |
|--------------|----------|-------|--------|---------|
| **parking_alerts** | alertsRealtime.js | public.parking_alerts | INSERT, UPDATE, DELETE | `supabase.removeChannel(channel)` en return de subscribeActiveAlerts |

**Channel name:** `parking_alerts_realtime` (único).

### Possible memory leaks

| Risk | Location | Notes |
|------|----------|-------|
| **useRealtimeAlerts** | useRealtimeAlerts.js | `unsub()` en cleanup del useEffect; depende de que Layout no desmonte. Si Layout se desmonta (ej. logout), cleanup correcto. |
| **ChatMessage.subscribe** | Chat.jsx | `unsubscribe?.()` en cleanup; correcto si conversationId/isDemo cambian. |
| **onAuthStateChange** | AuthContext.jsx | `subscription.unsubscribe()` en cleanup. |
| **DemoFlowManager listeners** | DemoFlowManager.jsx | `listeners` Set global; si componentes se suscriben y no hacen unsubscribe, persisten. `subscribeDemoFlow` retorna unsubscribe. |
| **Window events** | Múltiples | `waitme:badgeRefresh`, `waitme:goLogo`, `waitme:alertPublished`, etc. Handlers deben removerse en cleanup. |

### Duplicate listeners

| Event / subscription | Subscribers | Risk |
|----------------------|-------------|------|
| **parking_alerts_realtime** | 1 (useRealtimeAlerts) | No duplicado. |
| **ChatMessage.subscribe** | 1 por Chat montado | OK si solo un Chat a la vez. |
| **subscribeDemoFlow** | Chats, Chat (comentado), otros | Código comentado en Chat; si se activa, múltiples listeners. |
| **waitme:badgeRefresh** | BottomNav, History (vía mutations) | Múltiples dispatch; un handler por listener. OK. |

---

## 4. ALERT SYSTEM

### Files that manipulate alerts

| File | Operation | Backend |
|------|-----------|---------|
| **Home.jsx** | create (ParkingAlert.create), buy (update + Transaction + ChatMessage) | Base44 |
| **History.jsx** | create (repeat), update (extend, cancel, expire, status) | Base44 |
| **HistorySellerView.jsx** | update (accept, reject, extend, cancel) | Base44 |
| **HistoryBuyerView.jsx** | update (cancel reservation) | Base44 |
| **IncomingRequestModal.jsx** | update (accept, reject, me lo pienso) | Base44 |
| **ActiveAlertCard.jsx** | — | Solo UI |
| **Navigate.jsx** | update (complete), Transaction.create | Base44 |
| **WaitMeRequestScheduler.jsx** | get (verificar alert activa) | Base44 |
| **useRealtimeAlerts.js** | select, subscribe | Supabase |
| **alertsRealtime.js** | subscribe (onUpsert, onDelete) | Supabase |
| **alertService.js** | create, getActive, getActiveNear, reserve, close | Supabase |

### Base44 vs Supabase usage

| Flow | Base44 | Supabase |
|------|--------|----------|
| **Create alert** | Home.jsx, History.jsx (repeat) | alertService.createAlert — NO USADO |
| **Reserve alert** | Home.jsx (buyAlertMutation), IncomingRequestModal | alertService.reserveAlert — NO USADO |
| **Update status** | History*, IncomingRequestModal, Navigate | alertService.closeAlert — NO USADO |
| **Fetch my alerts** | useMyAlerts (Base44) | — |
| **Fetch nearby (search)** | — | — |
| **Search mode** | — | getMockNearbyAlerts (mock local) |
| **Realtime map** | — | useRealtimeAlerts → appStore |

### Dead code

| Item | Location | Notes |
|------|----------|-------|
| **alertService.js** | src/services/ | No importado por ningún flujo de negocio. |
| **useAlertsQuery.js** | src/hooks/ | useActiveAlertsQuery, useActiveAlertsNearQuery, useCreateAlertMutation, etc. — NO importados en ningún archivo. |
| **alertsKeys** (useAlertsQuery) | useAlertsQuery.js | Diferente de alertsKey/alertsPrefix en lib/alertsQueryKey. |

---

## 5. CHAT SYSTEM

### Base44 chat implementation

| Entity | Usage |
|--------|-------|
| **Conversation** | filter, create; Chats lista conversaciones; Chat carga una; IncomingRequestModal crea si no existe. |
| **ChatMessage** | filter, create, subscribe (realtime); Chat.jsx se suscribe a cambios por conversation_id. |

**Flujo:**
- Chats: `base44.entities.Conversation.filter` + ParkingAlert para contexto.
- Chat: `base44.entities.Conversation.filter`, `ChatMessage.filter`, `ChatMessage.subscribe`.
- IncomingRequestModal: crea Conversation + ChatMessage al aceptar.

### Dependency on alerts

| Dependency | Details |
|------------|---------|
| **Conversation.alert_id** | Conversaciones ligadas a alertas; sin alerta, conv puede ser genérica. |
| **Chat desde History** | Navegación a Chat con conversationId, alertId, otherName, etc. en URL. |
| **IncomingRequestModal** | Crea conv para alert_id al aceptar; buyer viene del request. |
| **DemoFlowManager** | ensureConversationForAlert, addIncomingWaitMeConversation; todo demo depende de alertas demo. |

---

## 6. MAP SYSTEM

### MapboxMap vs ParkingMap

| Aspect | MapboxMap | ParkingMap |
|--------|-----------|------------|
| **Data source** | useAppStore (alerts.items, location) | Props (alerts, userLocation, selectedAlert, sellerLocation) |
| **Import Mapbox** | Dynamic `import('mapbox-gl')` | Static `import mapboxgl` |
| **Use case** | Mapa de fondo en Home (clusters, marcador usuario) | Mapa de búsqueda/creación, rutas, marcadores detallados |
| **Alerts** | Supabase Realtime (appStore) | Mock (search) o props (create/navigate) |
| **Geolocation** | watchPosition → appStore.setLocation | Recibe userLocation por props |
| **Route** | No | OSRM fetch, polyline |

### Duplicate logic

| Logic | MapboxMap | ParkingMap |
|-------|-----------|------------|
| **Map init** | mapboxgl.Map, dark style, NavigationControl | Igual |
| **Car colors** | No (solo círculos) | carColors object, createCarMarkerHtml |
| **User marker** | Div purple circle | createUserLocationHtml |
| **Center** | OVIEDO_CENTER / props | defaultCenter desde userLocation |

**carColors / getCarFill** duplicado en: History.jsx, HistorySellerView, HistoryBuyerView, IncomingRequestModal, MarcoCard, UserAlertCard, ParkingMap, Notifications, carUtils.js, Profile.jsx.

---

## 7. DEMO SYSTEM

### DemoFlowManager

| Export | Purpose |
|--------|---------|
| **demoFlow** | Estado global: users, alerts, conversations, messages, notifications |
| **startDemoFlow** | Seed + setInterval(notify, 1000) |
| **subscribeDemoFlow** | Listeners para re-render cuando cambia demo |
| **getDemoConversations, getDemoAlerts, getDemoMessages** | Getters |
| **addDemoAlert, addIncomingWaitMeConversation** | Añadir alertas/conversaciones demo |
| **reserveDemoAlert, applyDemoAction** | Acciones demo |
| **sendDemoMessage, markDemoRead** | Chat/notificaciones |

### Simulated alerts

- **seedAlerts()**: `demoFlow.alerts = []` (vacío por defecto).
- **addDemoAlert**: Añade alerta al estado demo (ej. desde WaitMeRequestScheduler).
- **getMockNearbyAlerts**: 10 alertas mock fijas para modo search en Home (no usa demoFlow).

### Timers

| Timer | Location | Interval |
|-------|----------|----------|
| **tickTimer** | DemoFlowManager | 1000 ms (notify a listeners) |
| **startDemoFlow** | DemoFlowManager | Llamado desde componente; `startDemoFlow()` en useEffect está comentado en DemoFlowManager. |

---

## 8. NETWORK CALLS

### Supabase queries

| Location | Query |
|----------|-------|
| AuthContext | profiles insert/select, auth.getUser, onAuthStateChange |
| Login | auth.signInWithOAuth, setSession |
| Profile | profiles select/update, storage upload |
| useRealtimeAlerts | parking_alerts select (status=active) |
| alertsRealtime | postgres_changes (no query directo) |
| useMapMatch | functions.invoke('map-match') |
| alertService | parking_alerts insert/select/update — NO USADO |

### Base44 queries

| Location | Entity | Operation |
|----------|--------|-----------|
| Home | ParkingAlert, Transaction, ChatMessage, Notification | create, update, filter |
| History | ParkingAlert | create, update, filter |
| HistorySellerView | ParkingAlert | update |
| HistoryBuyerView | ParkingAlert, ChatMessage | update, create |
| Chats | Conversation, ParkingAlert, Notification | filter |
| Chat | Conversation, ChatMessage, auth.me | filter, create, subscribe |
| IncomingRequestModal | ParkingAlert, Conversation, ChatMessage | update, filter, create |
| Navigate | ParkingAlert, Transaction, ChatMessage | update, create |
| Notifications | Notification | filter |
| NotificationSettings | auth | updateMe |
| useMyAlerts | ParkingAlert | filter |
| WaitMeRequestScheduler | ParkingAlert | get |

### Unnecessary requests

| Issue | Location |
|-------|----------|
| **unreadCount** | Home.jsx refetch cada 15s aunque no haya cambios. |
| **myAlerts** | refetchOnWindowFocus: true; puede ser excesivo si usuario cambia pestaña a menudo. |
| **WaitMeRequestScheduler** | base44.entities.ParkingAlert.get dos veces (verificación + datos) a los 30s. |
| **Chat** | base44.auth.me() en query separado; AuthContext ya tiene user. |

---

## 9. RISK AREAS

### Bugs

| Area | Risk |
|------|------|
| **alertService schema** | Usa `user_id`, `price`, `vehicle_type`, `geohash`; migración core usa `seller_id`, `price_cents`. Incompatible. |
| **normalizeRow / normalizeAlert** | Mapean seller_id/user_id, price_cents/price; si Base44 y Supabase divergen en schema, puede fallar. |
| **formatAddress** | Definido localmente en History, IncomingRequestModal; lógica duplicada puede divergir. |
| **getCarFill / carColors** | 6+ implementaciones distintas; valores pueden no coincidir. |

### Race conditions

| Scenario | Location | Risk |
|----------|----------|------|
| **createAlert + invalidateQueries** | Home.jsx | Optimistic update en onMutate; si onError, restore. Si onSuccess e invalidate ocurren antes de que Realtime entregue, appStore puede tener datos viejos. |
| **buyAlertMutation** | Home.jsx | cancelQueries + setQueryData optimista; onError restaura. Posible race si múltiples clicks. |
| **Realtime vs Base44** | General | Usuario crea en Base44; Realtime puede no haber llegado; MapboxMap muestra appStore (Supabase). Si Supabase no tiene la tabla, appStore queda vacío. |
| **waitme:badgeRefresh** | BottomNav, History | invalidateQueries con refetchType: 'none' en BottomNav; puede no refetch. |

### Inconsistent state

| Scenario | Cause |
|----------|-------|
| **Map shows X alerts, History shows Y** | MapboxMap: appStore (Supabase). History: useMyAlerts (Base44). Fuentes distintas. |
| **Badge count ≠ list count** | Badge usa getVisibleActiveSellerAlerts(myAlerts); lista usa mismo selector. Si myAlerts está stale, ambos wrong. |
| **Demo vs real** | isDemo en Chat por URL; demoFlow es global. Si usuario navega real→demo sin reload, estado mezclado. |

---

## 10. CLEANUP PLAN

### Phase 1: Unify alert source

1. **Decidir fuente única**: Supabase (con migración core) o Base44.
2. Si **Supabase**:
   - Migrar Home.jsx create/buy a alertService (adaptar schema: seller_id, price_cents).
   - Migrar History*.jsx, IncomingRequestModal, Navigate a alertService.
   - Eliminar uso de base44.entities.ParkingAlert para alerts.
   - useMyAlerts: cambiar queryFn a Supabase o a appStore si Realtime es suficiente.
3. Si **Base44**:
   - Desactivar useRealtimeAlerts o usarlo solo para invalidar myAlerts.
   - MapboxMap: alimentar desde useMyAlerts en vez de appStore.

### Phase 2: Remove Base44 alerts

1. Sustituir todas las llamadas a `base44.entities.ParkingAlert` por alertService (Supabase) o equivalente.
2. Eliminar useMyAlerts Base44; crear useMyAlertsSupabase o unificar con appStore.
3. Eliminar alertService si se mantiene Base44 (y viceversa).

### Phase 3: Remove Base44 chat

1. Crear tablas `conversations`, `messages` en Supabase (ya en migración core).
2. Crear chatService (Supabase) para Conversation, ChatMessage.
3. Migrar Chats.jsx, Chat.jsx, IncomingRequestModal a Supabase.
4. Implementar Realtime para messages.
5. Eliminar base44.entities.Conversation, base44.entities.ChatMessage.

### Phase 4: Unify maps

1. **Opción A**: Un solo componente Map que reciba `mode` (background | search | create | navigate) y datos por props o store.
2. **Opción B**: Mantener MapboxMap y ParkingMap pero:
   - Unificar fuente de alerts (store o props desde misma fuente).
   - Extraer carColors/getCarFill a `utils/carUtils.js` y usar en ambos.
   - ParkingMap: recibir alerts de la misma fuente que MapboxMap (ej. store cuando en Home).

### Phase 5: Remove demo flows

1. Crear flag `VITE_DEMO_MODE` o ruta `/demo` en vez de `?demo=1`.
2. Si demo se elimina: borrar DemoFlowManager, getMockNearbyAlerts, WaitMeRequestScheduler (o simplificar a solo testing).
3. Si demo se mantiene: aislar en rutas/layout separado; no mezclar con flujo real en mismo árbol de componentes.

### Phase 6: Consolidate helpers

1. **formatAddress**: Un solo helper en `utils/` o `lib/`.
2. **carColors / getCarFill**: Ya existe `carUtils.getCarFill`; migrar todos los usos y eliminar duplicados.
3. **alertsQueryKey**: Unificar alertsKey (lib) y alertsKeys (useAlertsQuery); eliminar el no usado.

### Phase 7: Remove dead code

1. Eliminar `useAlertsQuery.js` si no se usa (o integrarlo como reemplazo de useMyAlerts).
2. Eliminar `alertService.js` si se mantiene Base44; si se migra a Supabase, eliminar código Base44 de alerts.
3. Eliminar `PageNotFound.jsx` o añadirlo a rutas como catch-all.

---

*Documento generado a partir del análisis del repositorio. No modifica código.*
