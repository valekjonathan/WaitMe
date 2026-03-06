# WaitMe — Auditoría Técnica Total

**Fecha:** 6 de marzo de 2025  
**Objetivo:** Preparar el sistema antes de implementar nuevas funcionalidades.

---

## 1. Estado general del proyecto

| Aspecto | Estado |
|---------|--------|
| Migración Supabase | Completa en todos los dominios |
| base44 | Eliminado (solo comentarios informativos en servicios) |
| Arquitectura | Sólida: adapters → servicios Supabase |
| Mapas | Estables con ResizeObserver y 100dvh |
| CI/CD | Activo (ci.yml en push/PR a main) |
| Demo vs real | Coexistencia intencional (DemoFlowManager + localStorage) |

**Veredicto:** 7.5/10 — Proyecto funcional, migrado y documentado. Listo para evolucionar con precaución en flujos demo/real.

---

## 2. Problemas encontrados

### Críticos
- Ninguno en estado actual.

### Medios
| Problema | Ubicación | Impacto |
|----------|-----------|---------|
| **Duplicidad alertService vs alertsSupabase** | `alertService.js` usa schema distinto (user_id, lat, lng). `data/alerts` usa `alertsSupabase`. `useAlertsQuery` importa `alertService` pero **no se usa en la app**. | Bajo: useAlertsQuery es código muerto. |
| **transactionEngine en memoria** | Balance, ban, comisión en `Map` en memoria. No persiste en Supabase. | Medio: al recargar se pierde. |
| **waitmeRequests en localStorage** | Solicitudes WaitMe en `waitme_requests_v1`. No en Supabase. | Medio: demo/local only. |
| **Lógica carColors duplicada** | History, Navigate, Profile, MarcoCard, UserAlertCard, Notifications definen `carColors` localmente. `lib/maps/carUtils` y `utils/carUtils` existen pero no unifican. | Bajo: mantenimiento. |
| **lib/maps/mapMarkers.js sin uso** | `createCarMarkerHtml`, `createUserLocationHtml` no importados. ParkingMap define los suyos inline. | Bajo: archivo muerto. |

### Bajos
- Chunk principal > 500KB (mapbox-gl, radix).
- Muchos componentes UI Radix importados; no todos se usan.
- Docs dispersos (30+ archivos en docs/).

---

## 3. Arquitectura actual

### Flujo de datos
```
Usuario → React → data/*.js (adapters) → services/*Supabase.js → Supabase API
                                    ↓
                            Realtime → appStore / React Query → UI
```

### Carpetas principales
| Carpeta | Contenido |
|---------|------------|
| `src/pages/` | Pantallas (Home, History, Chats, Chat, etc.) |
| `src/components/` | Componentes reutilizables y cards |
| `src/components/ui/` | Componentes Radix/shadcn |
| `src/data/` | Adapters (alerts, chat, notifications, profiles, transactions, uploads, userLocations) |
| `src/services/` | Servicios Supabase y alertService |
| `src/hooks/` | useMyAlerts, useRealtimeAlerts, useAlertsQuery, etc. |
| `src/lib/` | AuthContext, supabaseClient, utils, stores |
| `src/state/` | appStore (Zustand) |
| `src/utils/` | carUtils, index (createPageUrl) |
| `supabase/migrations/` | 15 migraciones SQL |
| `scripts/` | diagnose, ios-run, supabase-migrate, etc. |
| `docs/` | 35+ documentos |

### Inventario por tipo

**Pantallas (críticas):** Home, History, HistoryBuyerView, HistorySellerView, Chats, Chat, Notifications, NotificationSettings, Profile, Settings, Login, Navigate.

**Componentes críticos:** MapboxMap, ParkingMap, DemoFlowManager, IncomingRequestModal, WaitMeRequestScheduler, SellerLocationTracker, Header, BottomNav, CreateAlertCard, UserAlertCard, ActiveAlertCard.

**Hooks críticos:** useMyAlerts, useRealtimeAlerts, useProfileGuard, useAlertsQuery (no usado).

**Stores:** appStore (Zustand), finalizedAtStore (localStorage), waitmeRequests (localStorage).

**Servicios:** alertsSupabase, alertService (paralelo, schema distinto), chatSupabase, notificationsSupabase, profilesSupabase, transactionsSupabase, uploadsSupabase, userLocationsSupabase, alertsRealtime.

**Utils:** utils/carUtils (haversineKm, getCarFill, formatPlate), utils/index (createPageUrl), lib/vehicleIcons (getCarWithPriceHtml, getCarIconHtml).

**Secundarios:** lib/maps/mapMarkers (no usado), lib/maps/carUtils (getCarColor, carColors — no usado), lib/geohash, lib/transactionEngine, lib/logger, lib/sentry.

**Potencialmente muertos:** useAlertsQuery.js (nadie importa), lib/maps/mapMarkers.js (nadie importa), lib/maps/carUtils.js (nadie importa).

---

## 4. Partes aún demo

| Área | Demo | Real |
|------|------|------|
| **Alertas en Home (búsqueda)** | `getMockNearbyAlerts()` — 12–21 alertas mock alrededor del usuario | — |
| **Chats** | DemoFlowManager + localStorage `waitme:demo_conversations` | Supabase conversations, messages |
| **Notifications** | getDemoNotifications() + localStorage | Supabase notifications |
| **History** | thinking_requests, rejected_requests en localStorage | Supabase parking_alerts, transactions |
| **IncomingRequestModal** | Crea conversaciones demo en localStorage | También puede crear reales |
| **Navigate** | `alert.id.startsWith('demo_')` para datos fake | Supabase para reales |
| **transactionEngine** | Balance, ban en memoria (Map) | — |
| **waitmeRequests** | localStorage `waitme_requests_v1` | — |

---

## 5. Partes listas para producción

| Dominio | Estado | Tablas |
|---------|--------|--------|
| Auth | OK | auth.users |
| Profiles | OK | profiles |
| Parking Alerts | OK | parking_alerts |
| Reservations | OK | alert_reservations |
| Chat | OK | conversations, messages |
| Notifications | OK | notifications |
| Transactions | OK | transactions |
| Uploads | OK | Storage avatars |
| User Locations | OK | user_location_updates |

RLS activo en tablas. Adapters y servicios implementados. Realtime en parking_alerts, notifications, messages.

---

## 6. Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Token Mapbox inválido/caducado | Media | Mapa no renderiza | docs/MAP_DEBUG_CHECKLIST.md, npm run diagnose |
| transactionEngine en memoria se pierde al recargar | Alta | Balance/ban incorrectos | Migrar a Supabase o persistir en profiles |
| Demo y real mezclados en Chats/History | Media | Confusión, bugs al extender | Documentar flujos, separar claramente |
| alertService vs alertsSupabase schema distinto | Baja | useAlertsQuery no usado | Eliminar useAlertsQuery o unificar |
| Chunk > 500KB | Baja | Carga inicial lenta | Code-split con React.lazy |

---

## 7. Mejoras recomendadas

### Corto plazo
1. Eliminar o integrar `useAlertsQuery` y `alertService` — unificar con data/alerts.
2. Eliminar `lib/maps/mapMarkers.js` y `lib/maps/carUtils.js` si no se usan.
3. Consolidar `carColors` en un único módulo (utils/carUtils o lib/vehicleIcons).
4. Documentar explícitamente qué es demo y qué es real en cada pantalla.

### Medio plazo
5. Migrar transactionEngine a Supabase (tabla balances, bans) o persistir en profiles.
6. Sustituir getMockNearbyAlerts en Home por query real a parking_alerts (geohash).
7. Code-split: lazy load History, Profile, Chat.
8. Consolidar docs obsoletos en MIGRATION_COMPLETE.md.

### Largo plazo
9. Tests E2E para flujos críticos (login, crear alerta, reservar, chat).
10. Monitoreo (Sentry ya configurado, activar si VITE_SENTRY_DSN).

---

## 8. Revisión por fases

### FASE 1 — Inventario
- Carpetas, pantallas, componentes, hooks, stores, servicios, utils, scripts, docs documentados.
- Clasificación: críticos, secundarios, muertos.

### FASE 2 — Arquitectura

**Estado por dominio:**

| Dominio | Estado | Notas |
|---------|--------|-------|
| Auth | OK | Supabase Auth, AuthContext |
| Profiles | OK | profilesSupabase → data/profiles |
| Parking Alerts | OK | alertsSupabase → data/alerts |
| Reservations | OK | alert_reservations, status en parking_alerts |
| Chat | OK | chatSupabase → data/chat |
| Notifications | OK | notificationsSupabase → data/notifications |
| Transactions | OK | transactionsSupabase → data/transactions |
| Maps | OK | Mapbox + vehicleIcons, token requerido |

- Supabase: única fuente de verdad. OK.
- base44: solo comentarios. OK.
- Mocks/demo: intencionales (mockNearby, DemoFlowManager, localStorage). Parcial.
- Duplicidades: alertService vs alertsSupabase. Parcial.
- Lógica duplicada: carColors en varios sitios. Parcial.

### FASE 3 — Mapas
- MapboxMap: ResizeObserver, 100dvh, resizes escalonados. Estable.
- mockNearby: usado solo en Home para búsqueda. No afecta al mapa.
- vehicleIcons: usado por MapboxMap y ParkingMap. Estable.
- Overlays: gradiente en Home con pointer-events-none. No tapa.
- Contenedor: min-h-[100dvh] en Home. Estable.
- Dependencia frágil: VITE_MAPBOX_TOKEN. Sin token = "Mapa no disponible".

### FASE 4 — Base de datos
- Queries: vía servicios Supabase. RLS activo.
- Adapters: data/*.js delegan correctamente.
- Tablas: profiles, parking_alerts, alert_reservations, conversations, messages, notifications, transactions, user_location_updates.
- Inconsistencias: alertService usa user_id, lat, lng; alertsSupabase usa seller_id, price_cents, metadata. Solo alertService afectado; no usado por data layer.
- Manejo de errores: servicios retornan { data, error }. Algunos componentes podrían mejorar feedback.

### FASE 5 — Rendimiento
- Renders: React Query y Zustand reducen refetches. Algunos componentes podrían memoizarse más.
- Imports pesados: mapbox-gl, radix. Chunk principal grande.
- Componentes grandes: History.jsx, Chats.jsx, Home.jsx.
- Code-split: Layout ya usa lazy para Chats, Chat, etc. History y Profile no.

### FASE 6 — Seguridad
- Variables de entorno: VITE_* en .env. No commitear .env.
- Claves: anon key es pública por diseño. RLS protege datos.
- Acceso a tablas: RLS en todas.
- Validaciones: AuthContext y useProfileGuard. Algunos formularios podrían validar más.

### FASE 7 — Limpieza (solo listar, no borrar)
- **Archivos muertos:** useAlertsQuery.js (nadie importa), lib/maps/mapMarkers.js, lib/maps/carUtils.js.
- **Funciones no usadas:** las de useAlertsQuery, mapMarkers, maps/carUtils.
- **Dependencias:** Revisar si todos los paquetes de package.json se usan (recharts, ngeohash, etc.).
- **Código comentado:** Revisar manualmente en archivos grandes.

### FASE 8 — Preparación para nuevas funciones

| Función | Listo | Falta |
|---------|-------|-------|
| **Flujo real de alertas** | Sí (alertsSupabase, parking_alerts) | Sustituir getMockNearbyAlerts en Home por query geohash real |
| **Reservas** | Sí (alert_reservations, status reserved) | Integrar alert_reservations en flujo UI si no está |
| **Temporizadores** | Parcial | wait_until, expires_at existen. Timer visual en UI podría mejorarse |
| **Transacciones** | Sí (transactions table) | transactionEngine en memoria; migrar balance/ban a Supabase |
| **Notificaciones realtime** | Sí (Supabase Realtime en notifications) | Verificar suscripción activa en Notifications.jsx |

---

## 9. Roadmap técnico para terminar WaitMe

1. **Estabilización (1–2 sprints)**
   - Eliminar código muerto (useAlertsQuery, mapMarkers, maps/carUtils).
   - Unificar carColors.
   - Sustituir mockNearby en Home por query real (opcional si se quiere demo).

2. **Flujo real completo (2–3 sprints)**
   - Alertas de búsqueda desde Supabase (geohash).
   - Migrar transactionEngine a Supabase o profiles.
   - Reducir dependencia de DemoFlowManager en flujos críticos.

3. **Calidad y rendimiento (1 sprint)**
   - Code-split History, Profile.
   - Tests E2E flujos críticos.
   - Activar Sentry si aplica.

4. **Documentación**
   - Consolidar docs en MIGRATION_COMPLETE.md.
   - Mantener WAITME_AGENT_CONTEXT.md y PROJECT_SOURCE_OF_TRUTH.md actualizados.
