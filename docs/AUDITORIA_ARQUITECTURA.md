# Auditoría exhaustiva de arquitectura — WaitMe

**Fecha:** 2026-03-05  
**Objetivo:** Documentar estado actual, duplicidades, anti-patrones y plan de migración Base44 → Supabase.

---

## 1. Diagrama textual de módulos y dependencias

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              main.jsx (entry)                                     │
│  getSupabaseConfig() → MissingEnvScreen | ErrorBoundary → HashRouter → App       │
│  import './lib/sentry' (top-level)                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │ supabaseClient│   │  app-params   │   │ base44Client  │
            │ (lazy init)   │   │ (top-level)   │   │ (top-level)   │
            └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
                   │                   │                   │
                   │                   └─────────┬─────────┘
                   │                             │
                   ▼                             ▼
            ┌──────────────┐              ┌──────────────┐
            │ AuthContext   │              │ base44 SDK   │
            │ (user,profile)│              │ (ParkingAlert,│
            └──────┬───────┘              │  Chat, etc)   │
                   │                      └──────┬───────┘
                   │                             │
    ┌──────────────┼──────────────┐               │
    ▼             ▼              ▼               │
┌─────────┐ ┌──────────┐ ┌─────────────┐         │
│ Login   │ │ Layout   │ │ Profile     │         │
└─────────┘ │ useRealtimeAlerts       │         │
           │ → alertsRealtime → Supabase         │
           └──────────┬──────────────┘           │
                      │                          │
                      ▼                          │
           ┌──────────────────┐                  │
           │ appStore (Zustand)│◄────────────────┘
           │ alerts.items      │   Home, History, Chats, etc.
           │ location          │   usan base44.entities.ParkingAlert
           └─────────┬─────────┘   Y useMyAlerts (base44)
                     │
                     ▼
           ┌──────────────────┐
           │ MapboxMap         │  ← lee alerts de appStore
           │ (solo background) │
           └──────────────────┘

FLUJOS PARALELOS:
- Auth: Supabase (AuthContext) ✓
- Profiles: Supabase (AuthContext, Profile.jsx) ✓
- Alertas: base44 (Home, History, Chats, Navigate, etc.) + Supabase (alertService, useRealtimeAlerts, appStore)
- Chat: base44 (Chat.jsx, Chats.jsx, IncomingRequestModal)
- Transacciones: base44 (Navigate.jsx, History.jsx)
- Notificaciones: base44 (Notifications.jsx, NotificationSettings)
- Mapas: MapboxMap (Zustand) + ParkingMap (props, base44/demo)
```

---

## 2. Fuente de verdad por dominio

| Dominio | Fuente actual | Archivos clave | Estado |
|---------|---------------|----------------|--------|
| **Auth** | Supabase | `AuthContext.jsx`, `Login.jsx`, `supabaseClient.js` | ✓ Única |
| **Profiles** | Supabase | `AuthContext.jsx`, `Profile.jsx`, tabla `profiles` | ✓ Única |
| **Alerts** | **DUAL** base44 + Supabase | `useMyAlerts.js` (base44), `alertService.js` (Supabase), `useRealtimeAlerts` (Supabase → appStore), `Home.jsx`, `History.jsx` (base44) | ⚠️ Duplicado |
| **Realtime** | Supabase | `alertsRealtime.js`, `useRealtimeAlerts.js` → appStore | ✓ Solo parking_alerts |
| **Maps** | Mapbox + 2 componentes | `MapboxMap.jsx` (Zustand), `ParkingMap.jsx` (props), `SellerLocationTracker.jsx` | ⚠️ MapboxMap usa appStore; ParkingMap recibe alerts por props (base44/demo) |
| **State** | **DUAL** AuthContext + Zustand | `AuthContext` (user, profile), `appStore` (alerts, location, ui.error) | ⚠️ profile en ambos |
| **Errors** | Disperso | `AuthContext.authError`, `appStore.ui.error`, `ErrorBoundary`, `logger.js` → Sentry | ⚠️ Sin centralizar |
| **Networking** | base44 + Supabase | `base44Client.js`, `getSupabase()`, `alertService.js` | ⚠️ Dos backends |

---

## 3. Duplicidades y anti-patrones

### 3.1 Base44 vs Supabase

| Problema | Detalle |
|----------|---------|
| Auth dual | AuthContext usa Supabase; base44 usa `appParams.token` (URL/localStorage). JWT Supabase NO se pasa a base44. |
| Alertas duales | `useMyAlerts` → base44; `useRealtimeAlerts` → Supabase parking_alerts; `alertService` → Supabase. Home/History crean/actualizan vía base44. |
| Perfil dual | `profiles` en Supabase; `base44.auth.updateMe()` en NotificationSettings para `notifications_enabled`. |
| Demo vs real | DemoFlowManager (localStorage) + base44 para datos reales. Lógica bifurcada en Chats, History. |

### 3.2 Múltiples servicios / estados duplicados

| Duplicidad | Ubicaciones |
|------------|-------------|
| Alertas | `useMyAlerts` (base44), `useRealtimeAlerts` (Supabase → appStore), `useAlertsQuery` (alertService), `getVisibleActiveSellerAlerts` (alertSelectors) |
| User/Profile | AuthContext (user, profile) vs appStore (auth.user, profile) — appStore.auth/profile no se usan activamente |
| Query keys | `alertsKey`/`alertsPrefix` (lib/alertsQueryKey) vs `alertsKeys` (useAlertsQuery) — estructuras distintas |

### 3.3 Inicializaciones top-level

| Módulo | Archivo | Riesgo iOS |
|--------|---------|------------|
| Sentry | `main.jsx` import `./lib/sentry` | Bajo: solo init si DSN; no bloquea |
| app-params | `base44Client.js` importa `app-params` | Medio: `getAppParams()` usa `window`, `localStorage` en top-level |
| base44 | `base44Client.js` crea cliente en import | Medio: depende de app-params; si falta config puede fallar |
| Mapbox | `ParkingMap.jsx`, `SellerLocationTracker.jsx` import estático | Bajo: token se lee en useEffect |
| Mapbox | `MapboxMap.jsx` import dinámico | ✓ Seguro |

### 3.4 Rutas y Capacitor

| Aspecto | Estado |
|---------|--------|
| Router | HashRouter ✓ (compatible Capacitor) |
| Deep links | `capacitor://localhost` en Login OAuth redirect; `appUrlOpen`, `getLaunchUrl` en App.jsx ✓ |
| Rutas | `/`, `/home`, `/chats`, `/chat/:id`, `/profile`, `/settings`, `/history`, `/alertas`, `/notifications`, `/navigate` |

---

## 4. Inventario: llamadas a Base44

### 4.1 Cliente y configuración

| Archivo | Uso |
|---------|-----|
| `src/api/base44Client.js` | `createClient` con appParams, envs `VITE_BASE44_*` |
| `src/lib/app-params.js` | `VITE_BASE44_APP_ID`, `VITE_BASE44_BACKEND_URL`, `VITE_BASE44_API_BASE_URL`, `base44_access_token` |
| `vite.config.js` | Plugin `@base44/vite-plugin` |
| `package.json` | `@base44/sdk`, `@base44/vite-plugin` |

### 4.2 Llamadas por archivo

| Archivo | Entidad/API | Operaciones |
|---------|-------------|-------------|
| `src/pages/Home.jsx` | ParkingAlert, Notification | filter, create, update; Notification.filter |
| `src/pages/History.jsx` | ParkingAlert, Transaction | filter, create, update, delete, list |
| `src/pages/HistorySellerView.jsx` | ParkingAlert | update |
| `src/pages/HistoryBuyerView.jsx` | ParkingAlert, ChatMessage | update, create |
| `src/pages/Chats.jsx` | Conversation, ParkingAlert, Notification | list, filter, create |
| `src/pages/Chat.jsx` | auth.me, Conversation, ChatMessage | filter, create, update, subscribe; UploadFile |
| `src/pages/Navigate.jsx` | auth.me, ParkingAlert, Transaction, ChatMessage | filter, update, create |
| `src/pages/Notifications.jsx` | ParkingAlert | get, update |
| `src/pages/NotificationSettings.jsx` | auth.updateMe | updateMe |
| `src/hooks/useMyAlerts.js` | ParkingAlert | filter |
| `src/components/IncomingRequestModal.jsx` | ParkingAlert, auth.me, Conversation, ChatMessage | update, filter, create |
| `src/components/WaitMeRequestScheduler.jsx` | ParkingAlert | get |
| `src/components/SellerLocationTracker.jsx` | ParkingAlert, UserLocation | filter |
| `src/components/cards/ActiveAlertCard.jsx` | ParkingAlert | update |
| `src/lib/PageNotFound.jsx` | auth.me | me |

### 4.3 Integraciones y entidades

| Archivo | Uso |
|---------|-----|
| `src/api/integrations.js` | Re-exporta base44.integrations.Core (InvokeLLM, SendEmail, UploadFile, etc.) |
| `src/api/entities.js` | Re-exporta base44.entities.Query, base44.auth |

---

## 5. BORRAR / UNIFICAR / REFACTORIZAR

### BORRAR (tras migración)

| Ruta | Motivo |
|------|--------|
| `src/api/base44Client.js` | Sustituido por Supabase |
| `src/api/entities.js` | Depende de base44 |
| `src/api/integrations.js` | Depende de base44; evaluar qué integraciones se usan |
| `src/lib/app-params.js` | Solo para base44; eliminar o reducir a lo mínimo |
| `vite.config.js` plugin base44 | Eliminar tras quitar SDK |
| `package.json` @base44/sdk, @base44/vite-plugin | Eliminar |
| `functions/searchGooglePlaces.ts` | Usa `base44` en signature; migrar o eliminar |

### UNIFICAR

| Qué | Cómo |
|-----|------|
| Alertas | Una sola fuente: Supabase `parking_alerts`. Eliminar `useMyAlerts` (base44), usar `alertService` + `useRealtimeAlerts` + `useAlertsQuery` |
| User/Profile | Mantener AuthContext como única fuente; no duplicar en appStore.auth/profile |
| Query keys | Unificar en `lib/alertsQueryKey.js` o `hooks/useAlertsQuery.js`; una sola convención |
| Notificaciones usuario | `profiles.notifications_enabled` en Supabase; eliminar `base44.auth.updateMe` en NotificationSettings |

### REFACTORIZAR

| Ruta | Cambio |
|------|--------|
| `src/pages/Home.jsx` | Sustituir base44.entities.ParkingAlert por alertService + useRealtimeAlerts |
| `src/pages/History.jsx` | Sustituir base44 por alertService; Transaction → tabla Supabase |
| `src/pages/Chats.jsx` | Conversation → Supabase (crear tabla) |
| `src/pages/Chat.jsx` | ChatMessage, Conversation → Supabase |
| `src/pages/Navigate.jsx` | ParkingAlert, Transaction, ChatMessage → Supabase |
| `src/pages/Notifications.jsx` | ParkingAlert.get/update → Supabase |
| `src/pages/NotificationSettings.jsx` | base44.auth.updateMe → supabase.from('profiles').update |
| `src/hooks/useMyAlerts.js` | Reescribir para usar alertService.getActiveAlerts |
| `src/components/IncomingRequestModal.jsx` | ParkingAlert, Conversation, ChatMessage → Supabase |
| `src/components/WaitMeRequestScheduler.jsx` | ParkingAlert.get → Supabase |
| `src/components/SellerLocationTracker.jsx` | ParkingAlert, UserLocation → Supabase (UserLocation puede requerir tabla) |
| `src/components/cards/ActiveAlertCard.jsx` | ParkingAlert.update → alertService.closeAlert |
| `src/lib/PageNotFound.jsx` | base44.auth.me → useAuth().user |

---

## 6. Plan en 10 pasos: migrar Base44 → Supabase sin romper iOS

| Paso | Acción | Archivos | Verificación |
|------|--------|----------|--------------|
| 1 | Crear tablas Supabase: `conversations`, `chat_messages`, `transactions`, `user_locations` (si aplica) | `supabase/migrations/` | `supabase db push` o migración directa |
| 2 | Crear servicios: `chatService.js`, `transactionService.js` | `src/services/` | Tests unitarios o manual |
| 3 | Sustituir `useMyAlerts` por `alertService` + `useRealtimeAlerts`; Home/History usan alertService para crear/actualizar | `useMyAlerts.js`, `Home.jsx`, `History.jsx` | Login → crear alerta → ver en mapa |
| 4 | Migrar NotificationSettings: `profiles.update` en lugar de `base44.auth.updateMe` | `NotificationSettings.jsx` | Cambiar toggle → verificar en Supabase |
| 5 | Migrar IncomingRequestModal y WaitMeRequestScheduler a Supabase | `IncomingRequestModal.jsx`, `WaitMeRequestScheduler.jsx` | Flujo reserva/aceptar |
| 6 | Migrar Chats y Chat: conversations + chat_messages en Supabase | `Chats.jsx`, `Chat.jsx` | Lista conversaciones, enviar mensaje |
| 7 | Migrar Navigate: completar alerta, crear transaction y mensaje en Supabase | `Navigate.jsx` | Flujo llegar → completar |
| 8 | Migrar History (Seller/Buyer views), ActiveAlertCard, SellerLocationTracker | Varios | Cancelar, prorrogar, ver ubicación |
| 9 | Eliminar base44: quitar imports, borrar base44Client, app-params, plugin Vite | Varios | Build sin errores |
| 10 | Limpieza: eliminar `api/entities.js`, `api/integrations.js`, ajustar envs | Varios | `npm run ios:run` ✓ |

**Regla por paso:** Hacer un paso → `npm run build` → `npm run ios:run` → verificar en simulador.

---

## 7. Cómo obtener info de Supabase (una captura)

**Opción más simple — una sola captura:**

1. Supabase Dashboard → tu proyecto → **SQL Editor**.
2. Pegar y ejecutar:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'parking_alerts', 'conversations', 'chat_messages', 'transactions')
ORDER BY table_name, ordinal_position;
```

3. Guardar el resultado (CSV o screenshot).

**URL y anon key:** Project Settings → API → `Project URL` = `VITE_SUPABASE_URL`, `anon public` = `VITE_SUPABASE_ANON_KEY`.

---

## 8. Top 15 riesgos y mitigación

| # | Riesgo | Mitigación |
|---|--------|------------|
| 1 | Auth dual (Supabase vs base44) desincroniza sesión | Pasar JWT Supabase a base44 mientras coexistan, o migrar todo a Supabase primero |
| 2 | base44 top-level init falla si falta token | Envolver en try/catch; degradar a modo "sin base44" si falla |
| 3 | Mapbox sin token rompe UI | ✓ Ya: "Mapa no disponible"; ParkingMap igual |
| 4 | Sentry init bloquea arranque | ✓ Ya: solo init si DSN; no bloquea |
| 5 | HashRouter → BrowserRouter rompe deep links iOS | No cambiar; mantener HashRouter |
| 6 | Preferences vs localStorage en logout | ✓ Ya: clearSupabaseAuthStorage usa Preferences.keys() |
| 7 | Realtime no conecta (RLS, publication) | Verificar `supabase_realtime` incluye `parking_alerts`; RLS permite SELECT |
| 8 | useMyAlerts (base44) y useRealtimeAlerts (Supabase) muestran datos distintos | Unificar: una sola fuente Supabase |
| 9 | DemoFlowManager y datos reales mezclados | Separar claramente; flag `useDemo` o similar |
| 10 | Transaction/Conversation sin tabla en Supabase | Crear migraciones antes de migrar código |
| 11 | UploadFile (base44) en Chat | Sustituir por Supabase Storage |
| 12 | SellerLocationTracker usa UserLocation (base44) | Crear tabla `user_locations` o usar otro mecanismo |
| 13 | app-params usa localStorage en SSR/build | ✓ Ya: `isNode` check; en build no hay window |
| 14 | Capacitor OAuth redirect incorrecto | ✓ Ya: `capacitor://localhost`; validar en Supabase Dashboard |
| 15 | Eliminar base44 rompe vite build (plugin) | Quitar plugin en último paso; probar build sin él |

---

## 9. Checklist de pruebas antes de cada merge

### Web

- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin errores
- [ ] `npm run typecheck` sin errores
- [ ] `npm run test` (Playwright) pasa
- [ ] Login con Google en navegador
- [ ] Crear alerta → aparece en mapa
- [ ] Cerrar sesión → vuelve a Login
- [ ] Profile carga sin "Error al guardar"

### iOS Simulador

- [ ] `npm run ios:run` completa y lanza app
- [ ] No pantalla negra al abrir
- [ ] Login con Google (Browser externo → vuelve a app)
- [ ] Sesión persiste tras cerrar y reabrir app
- [ ] Mapa carga o muestra "Mapa no disponible"
- [ ] Navegación entre tabs/pantallas fluida
- [ ] Cerrar sesión desde Settings → vuelve a Login

### Variables de entorno mínimas

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_MAPBOX_TOKEN` (opcional; sin él mapa muestra mensaje)
- [ ] `VITE_BASE44_*` (solo mientras base44 siga en uso)

---

## 10. Resumen ejecutivo

- **Auth y Profiles:** Migrados a Supabase.
- **Alertas:** Estado híbrido; Realtime y alertService en Supabase; Home/History aún usan base44.
- **Chat, Transactions, Notifications:** base44.
- **Principales acciones:** Unificar alertas en Supabase; crear tablas para chat/transactions; migrar página a página; eliminar base44 al final.
- **Riesgo iOS:** Bajo si se mantiene HashRouter, init lazy de Supabase y manejo de Mapbox sin token.
