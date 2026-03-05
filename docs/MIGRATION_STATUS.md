# Estado de migración Base44 → Supabase

**Fecha auditoría:** 2025-03-04  
**Conclusión:** La migración **NO está terminada**. Base44 sigue siendo la fuente principal de datos para alertas, chat, transacciones, notificaciones y auth secundario.

---

## 1. Resumen ejecutivo

| Área | Estado | Fuente actual |
|------|--------|---------------|
| **Auth** | Parcial | Supabase Auth (login) + Base44 `auth.me()` / `auth.updateMe()` en varios flujos |
| **Database** | Dual | Base44 (operativo) + Supabase (schema listo, poco usado) |
| **Alerts** | Base44 | `base44.entities.ParkingAlert` en toda la app; `alertService` (Supabase) existe pero no se usa |
| **Chat** | Base44 | `base44.entities.Conversation`, `ChatMessage` |
| **Transactions** | Base44 | `base44.entities.Transaction` |
| **Notifications** | Base44 | `base44.entities.Notification`, `base44.auth.updateMe()` |
| **UserLocation** | Base44 | `base44.entities.UserLocation` (SellerLocationTracker) |
| **Realtime** | Supabase | `useRealtimeAlerts`, `alertsRealtime.js` → appStore (mapa) |
| **File upload** | Base44 | `base44.integrations.Core.UploadFile` (Chat.jsx) |
| **Deploy** | Independiente | Vite build; no depende de Base44 deploy |

---

## 2. Dónde vive cada parte del sistema

### FRONTEND

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se construye con Vite? | Sí (`vite build`) |
| ¿Puede desplegarse desde GitHub? | Sí. Build estándar; CI ya configurado. |
| ¿Depende de Base44 para build? | Sí. `@base44/vite-plugin` en `vite.config.js`; se puede eliminar tras migración. |

### BACKEND

| Pregunta | Respuesta |
|----------|-----------|
| ¿Todo está en Supabase? | No. La lógica de negocio activa usa Base44 API (`api.base44.app`). |
| ¿Supabase tiene el schema? | Sí. `parking_alerts`, `conversations`, `messages`, `alert_reservations`, `user_locations` en migraciones. |
| ¿Se usa el schema Supabase? | Parcial. `alertService.js` usa Supabase pero no está integrado en los flujos principales. |

### AUTH

| Pregunta | Respuesta |
|----------|-----------|
| ¿Supabase Auth o Base44? | Ambos. Login: Supabase OAuth. Perfil: Supabase `profiles`. Pero Chat, Navigate, IncomingRequestModal, PageNotFound, NotificationSettings usan `base44.auth.me()` y `base44.auth.updateMe()`. |
| ¿JWT Supabase en Base44? | No. Base44 usa `appParams.token` (URL/localStorage), no el JWT de Supabase. Riesgo de sesiones desincronizadas. |

### DATABASE

| Pregunta | Respuesta |
|----------|-----------|
| ¿Todas las tablas en Supabase? | El schema existe en Supabase. Los datos operativos siguen en Base44. |
| ¿Tablas Supabase usadas? | `profiles` (Profile, AuthContext). `parking_alerts` solo vía Realtime (appStore) y `alertService` (no integrado). |

### REALTIME

| Pregunta | Respuesta |
|----------|-----------|
| ¿Supabase Realtime o Base44? | Supabase Realtime para `parking_alerts` (MapboxMap usa appStore). Base44 `ChatMessage.subscribe` para chat. |
| ¿Fuentes de datos divergentes? | Sí. Mapa: appStore (Supabase). History/Home/useMyAlerts: Base44. Pueden mostrar datos distintos. |

### DEPLOY

| Pregunta | Respuesta |
|----------|-----------|
| ¿Deploy desde GitHub? | Sí. Build Vite → `dist/`. Sin dependencia de Base44 para deploy. |
| ¿Base44 deploy? | No. El proyecto puede desplegarse en Vercel, Netlify, etc. |

---

## 3. Archivos que usan Base44 (lista exacta)

### Código fuente (imports y llamadas)

| Archivo | Uso |
|---------|-----|
| `src/api/base44Client.js` | Cliente Base44; `createClient` |
| `src/api/entities.js` | Re-exporta `base44.entities.Query`, `base44.auth` |
| `src/api/integrations.js` | Re-exporta `base44.integrations.Core` (UploadFile, etc.) |
| `src/lib/app-params.js` | `base44_*` storage keys, `VITE_BASE44_*` env, `base44_access_token` |
| `src/pages/Home.jsx` | ParkingAlert create/filter/update, Transaction.create, ChatMessage.create, Notification.filter |
| `src/pages/History.jsx` | ParkingAlert CRUD, Transaction.list, múltiples updates |
| `src/pages/HistorySellerView.jsx` | ParkingAlert.update |
| `src/pages/HistoryBuyerView.jsx` | ParkingAlert.update, ChatMessage.create |
| `src/pages/Chat.jsx` | auth.me, Conversation.filter, ChatMessage filter/create/subscribe/update, UploadFile |
| `src/pages/Chats.jsx` | Conversation.list, ParkingAlert.list, Notification.create |
| `src/pages/Navigate.jsx` | auth.me, ParkingAlert filter/update, Transaction.create, ChatMessage.create |
| `src/pages/Notifications.jsx` | ParkingAlert.get, ParkingAlert.update |
| `src/pages/NotificationSettings.jsx` | base44.auth.updateMe (notifications_enabled, notify_*) |
| `src/components/IncomingRequestModal.jsx` | auth.me, ParkingAlert.update, Conversation filter/create, ChatMessage.create |
| `src/components/WaitMeRequestScheduler.jsx` | ParkingAlert.get |
| `src/components/SellerLocationTracker.jsx` | ParkingAlert.filter, UserLocation.filter |
| `src/components/cards/ActiveAlertCard.jsx` | ParkingAlert.update |
| `src/hooks/useMyAlerts.js` | ParkingAlert.filter |
| `src/lib/PageNotFound.jsx` | base44.auth.me |
| `src/services/alertService.js` | Comentario: "Sustituye base44.entities.ParkingAlert cuando se complete la migración" |

### Configuración y dependencias

| Archivo | Uso |
|---------|-----|
| `package.json` | `"name": "base44-app"`, `@base44/sdk`, `@base44/vite-plugin` |
| `vite.config.js` | `import base44 from "@base44/vite-plugin"`, plugin `base44()` |
| `.env.example` | `VITE_BASE44_API_BASE_URL` |

### Funciones (Base44 backend)

| Archivo | Uso |
|---------|-----|
| `functions/searchGooglePlaces.ts` | Signature `{ base44 }` (no usa lógica Base44, solo inyección) |

---

## 4. Entidades Base44 en uso

| Entidad | Operaciones | Archivos |
|---------|-------------|----------|
| `ParkingAlert` | get, filter, list, create, update, delete, subscribe (implícito vía Realtime Supabase) | Home, History, HistorySellerView, HistoryBuyerView, Chats, Navigate, Notifications, IncomingRequestModal, WaitMeRequestScheduler, SellerLocationTracker, ActiveAlertCard, useMyAlerts |
| `Conversation` | filter, list, create, update | Chat, Chats, IncomingRequestModal |
| `ChatMessage` | filter, create, subscribe | Chat, Chats, HistoryBuyerView, IncomingRequestModal, Home, Navigate |
| `Transaction` | list, create | History, Home, Navigate |
| `Notification` | filter, create | Home, Chats |
| `UserLocation` | filter | SellerLocationTracker |
| `base44.auth` | me(), updateMe() | Chat, Navigate, IncomingRequestModal, PageNotFound, NotificationSettings |
| `base44.integrations.Core` | UploadFile | Chat.jsx |

---

## 5. Variables de entorno Base44

| Variable | Uso |
|----------|-----|
| `VITE_BASE44_APP_ID` | appParams.appId |
| `VITE_BASE44_BACKEND_URL` | serverUrl (base44Client, app-params) |
| `VITE_BASE44_API_BASE_URL` | Fallback serverUrl |
| `BASE44_LEGACY_SDK_IMPORTS` | vite-plugin (opcional) |

---

## 6. Qué está migrado

- **Auth login:** Supabase OAuth (Login.jsx)
- **Perfil:** Supabase `profiles` (Profile.jsx, AuthContext)
- **Realtime alertas:** Supabase Realtime → appStore (MapboxMap)
- **Map-match:** Supabase Edge Function
- **Schema DB:** Migraciones Supabase con parking_alerts, conversations, messages, user_locations, alert_reservations
- **Build/Deploy:** Vite; independiente de Base44

---

## 7. Qué falta para eliminar Base44

1. **Alertas:** Sustituir todas las llamadas a `base44.entities.ParkingAlert` por `alertService` (Supabase) o servicio equivalente. Ajustar schema si hay diferencias (seller_id vs user_id, price_cents vs price).
2. **Chat:** Implementar chat con Supabase `conversations` + `messages`; sustituir `base44.entities.Conversation`, `ChatMessage` y `ChatMessage.subscribe` por Supabase Realtime.
3. **Transactions:** Crear tabla `transactions` en Supabase (si no existe) y migrar create/list.
4. **Notifications:** Migrar a Supabase (tabla o `profiles`) y sustituir `base44.entities.Notification` y `base44.auth.updateMe()`.
5. **UserLocation:** Usar Supabase `user_locations` en SellerLocationTracker.
6. **Auth secundario:** Eliminar `base44.auth.me()` y `base44.auth.updateMe()`; usar solo AuthContext + Supabase profiles.
7. **File upload:** Sustituir `base44.integrations.Core.UploadFile` por Supabase Storage.
8. **Limpieza:** Eliminar `base44Client.js`, `entities.js`, `integrations.js`, plugin Vite, dependencias npm, variables de entorno, `app-params.js` (o refactorizar).
9. **searchGooglePlaces:** Migrar a Supabase Edge Function o servicio externo; eliminar dependencia de `base44` en la signature.

---

## 8. Plan automático propuesto para eliminar Base44

### Fase 1: Preparación (sin tocar flujos)

1. Verificar que el schema Supabase (`parking_alerts`, `conversations`, `messages`, `user_locations`) coincide con el uso actual o crear migraciones de ajuste.
2. Crear tabla `transactions` en Supabase si no existe.
3. Añadir columnas de notificaciones en `profiles` si faltan (`notify_reservations`, etc.).
4. Crear servicios Supabase: `chatService.js`, `transactionService.js`, `userLocationService.js`, `notificationService.js` (o extender profiles).

### Fase 2: Sustitución por capas

1. **alertService:** Ya existe. Integrarlo en Home, History, useMyAlerts, etc. Sustituir cada llamada a `base44.entities.ParkingAlert` por el servicio. Ajustar mapeo de campos (user_id↔seller_id, price↔price_cents).
2. **Chat:** Crear `chatService.js` con Supabase. Sustituir en Chat.jsx, Chats.jsx, IncomingRequestModal, HistoryBuyerView, Navigate. Usar Realtime para mensajes.
3. **Transactions:** Crear `transactionService.js`. Sustituir en History, Home, Navigate.
4. **UserLocation:** Crear/ajustar servicio. Sustituir en SellerLocationTracker.
5. **Notifications:** Usar `profiles` o tabla dedicada. Sustituir en NotificationSettings, Home, Chats.
6. **Auth:** Sustituir `base44.auth.me()` por `useAuth().user` o query a profiles. Sustituir `base44.auth.updateMe()` por update a `profiles`.
7. **UploadFile:** Sustituir por Supabase Storage en Chat.jsx.

### Fase 3: Eliminación

1. Eliminar imports de `base44` en todos los archivos listados.
2. Eliminar `src/api/base44Client.js`, `src/api/entities.js`, `src/api/integrations.js`.
3. Refactorizar `app-params.js`: eliminar referencias Base44; mantener solo lo necesario para Supabase/Mapbox.
4. Eliminar `@base44/sdk` y `@base44/vite-plugin` de package.json.
5. Eliminar plugin de `vite.config.js`.
6. Eliminar variables `VITE_BASE44_*` de `.env.example` y documentación.
7. Renombrar `package.json` name a `waitme-app` o similar.
8. Migrar o eliminar `functions/searchGooglePlaces.ts`.

### Orden sugerido de archivos a modificar

1. `useMyAlerts.js` → usar alertService o Supabase directo
2. `Home.jsx` → alertService, transactionService, chatService, notificationService
3. `History.jsx` → alertService, transactionService
4. `HistorySellerView.jsx`, `HistoryBuyerView.jsx` → alertService, chatService
5. `Chat.jsx`, `Chats.jsx` → chatService, Supabase Storage
6. `Navigate.jsx` → alertService, transactionService, chatService
7. `Notifications.jsx`, `NotificationSettings.jsx` → profiles/notificationService
8. `IncomingRequestModal.jsx` → alertService, chatService
9. `WaitMeRequestScheduler.jsx`, `SellerLocationTracker.jsx`, `ActiveAlertCard.jsx` → alertService, userLocationService
10. `PageNotFound.jsx` → useAuth
11. Eliminar archivos API Base44 y dependencias

---

## 9. Riesgos durante la migración

- **Schema mismatch:** `alertService` usa `user_id`, `price`, `geohash`; `core_schema` usa `seller_id`, `price_cents`. Verificar migraciones aplicadas y unificar.
- **Realtime:** Asegurar que `ChatMessage.subscribe` se sustituye correctamente por Supabase Realtime.
- **Sesiones:** Base44 y Supabase usan tokens distintos; al eliminar Base44 auth, validar que no queden flujos rotos.
- **UploadFile:** Definir bucket y políticas en Supabase Storage antes de sustituir.
