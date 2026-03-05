# Migración Alerts: Base44 → Supabase

**Fase:** 1 — Crear capa Supabase (sin eliminar Base44)  
**Fecha:** 2025-03-04

---

## 1. Análisis realizado

### Uso actual de Base44 relacionado con alertas

| Archivo | Uso |
|---------|-----|
| `src/hooks/useMyAlerts.js` | `base44.entities.ParkingAlert.filter({ user_id })` para mis alertas |
| `src/pages/Home.jsx` | create, filter, update |
| `src/pages/History.jsx` | create, filter, update, delete, múltiples updates de status |
| `src/pages/HistorySellerView.jsx` | update (accept/reject reserva) |
| `src/pages/HistoryBuyerView.jsx` | update (cancel) |
| `src/pages/Notifications.jsx` | get, update |
| `src/pages/Chats.jsx` | ParkingAlert.list |
| `src/pages/Navigate.jsx` | filter, update (complete, cancel) |
| `src/components/IncomingRequestModal.jsx` | update |
| `src/components/WaitMeRequestScheduler.jsx` | get |
| `src/components/SellerLocationTracker.jsx` | filter |
| `src/components/cards/ActiveAlertCard.jsx` | update |
| `src/components/BottomNav.jsx` | useMyAlerts (badge) |

### alertService existente

- `src/services/alertService.js`: CRUD básico con Supabase, usa schema legacy (`user_id`, `price`, `geohash`).
- `src/hooks/useAlertsQuery.js`: hooks React Query que usan alertService (no integrados en flujos principales).
- `src/services/realtime/alertsRealtime.js`: Realtime para parking_alerts → appStore.
- `src/hooks/useRealtimeAlerts.js`: carga inicial + subscribe → appStore (mapa).

### Schema Supabase existente

Las migraciones ya definen:

- **parking_alerts** (core_schema): `seller_id`, `status`, `lat`, `lng`, `address_text`, `price_cents`, `currency`, `expires_at`, `metadata`, `created_at`, `updated_at`
- **alert_reservations**: `alert_id`, `buyer_id`, `status` (requested, accepted, active, completed, cancelled, expired)

Faltaba:

- **geohash** en parking_alerts (para búsquedas por proximidad)
- Trigger para sincronizar `parking_alerts.status = 'reserved'` cuando se acepta una reserva

---

## 2. Cambios realizados

### 2.1 Nueva migración

**Archivo:** `supabase/migrations/20260305170000_add_geohash_and_reservation_trigger.sql`

- Añade columna `geohash` a `parking_alerts`
- Índice `idx_parking_alerts_geohash_status` para consultas por proximidad
- Función `on_reservation_accepted()` (SECURITY DEFINER): al insertar o actualizar `alert_reservations` con `status = 'accepted'`, actualiza `parking_alerts.status = 'reserved'`

### 2.2 Nuevo servicio

**Archivo:** `src/services/alertsSupabase.js`

| Función | Descripción |
|---------|-------------|
| `createAlert(payload)` | Crea alerta. Acepta payload Supabase o Base44-style (user_id, price, latitude/longitude, address). |
| `updateAlert(alertId, updates)` | Actualiza status, priceCents, expiresAt, addressText, metadata, available_in_minutes, cancel_reason. |
| `deleteAlert(alertId)` | Elimina alerta. |
| `getNearbyAlerts(lat, lng, radiusKm)` | Alertas activas cerca de (lat, lng) usando geohash. |
| `getMyAlerts(sellerId)` | Alertas del vendedor. |
| `getAlert(alertId)` | Obtiene una alerta por ID. |
| `subscribeAlerts({ onUpsert, onDelete })` | Realtime: INSERT, UPDATE, DELETE en parking_alerts. |

**Normalización:** Todas las respuestas usan `normalizeAlert()` para unificar formato (user_id/seller_id, price/price_cents, lat/latitude, etc.) compatible con el resto de la app.

---

## 3. Schema final

### parking_alerts

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| seller_id | uuid | FK auth.users |
| status | text | active, reserved, expired, completed, cancelled |
| lat, lng | double precision | Coordenadas |
| address_text | text | Dirección |
| price_cents | int | Precio en céntimos |
| currency | text | EUR |
| expires_at | timestamptz | Expiración |
| geohash | text | Para búsquedas por proximidad |
| metadata | jsonb | vehicle_type, available_in_minutes, etc. |
| created_at, updated_at | timestamptz | |

### alert_reservations

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| alert_id | uuid | FK parking_alerts |
| buyer_id | uuid | FK auth.users |
| status | text | requested, accepted, active, completed, cancelled, expired |
| started_at, expires_at | timestamptz | |
| created_at, updated_at | timestamptz | |

### alert_status

Los valores de status están definidos por CHECK en las tablas. No existe tabla `alert_status` separada; el status es una columna en `parking_alerts` y `alert_reservations`.

---

## 4. Próximos pasos (sustitución)

1. Crear `useMyAlertsSupabase` que use `alertsSupabase.getMyAlerts(sellerId)` en lugar de Base44.
2. Sustituir en cada componente las llamadas a `base44.entities.ParkingAlert` por `alertsSupabase.*`.
3. Ajustar mapeo de payloads Base44 → Supabase donde haga falta (ej. `user_email` si se usa para usuarios sin auth).
4. Validar RLS: actualmente solo el seller puede UPDATE/DELETE parking_alerts; si hay flujos donde el buyer actualiza (ej. cancelar reserva), añadir políticas o triggers.
5. Una vez migrado todo, eliminar imports de Base44 relacionados con ParkingAlert.

---

## 5. Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/20260305170000_add_geohash_and_reservation_trigger.sql` | Creado |
| `src/services/alertsSupabase.js` | Creado |
| `docs/MIGRATION_ALERTS.md` | Creado |

**Base44 no se ha eliminado.** La capa Supabase está lista para empezar la sustitución gradual.
