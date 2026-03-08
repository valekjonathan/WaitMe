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

## 4. Migración History.jsx (2025-03-04)

### Cambios realizados

1. **useMyAlerts.js**
   - Sustituido `base44.entities.ParkingAlert.filter` por `alertsSupabase.getMyAlerts` + `getAlertsReservedByMe`.
   - Añadida suscripción Realtime con `subscribeAlerts` para invalidar cache al cambiar alertas.
   - Soporta alertas como vendedor y como comprador (Tus alertas + Tus reservas).

2. **History.jsx**
   - Sustituidas todas las llamadas a `base44.entities.ParkingAlert` por `alertsSupabase.*`:
     - `deleteAlertSafe` → `alertsSupabase.deleteAlert`
     - `cancelAlertMutation` → `updateAlert` + `getMyAlerts`
     - `expireAlertMutation` → `updateAlert`
     - `repeatAlertMutation` → `updateAlert` + `createAlert`
     - Auto-expirar alertas y reservas → `updateAlert`
     - ExpiredBlock, cancelReservedOpen, expiredAlertModalId → `updateAlert`
   - Se mantiene `base44.entities.Transaction.list` (no migrado).

3. **HistorySellerView.jsx**
   - `base44.entities.ParkingAlert.update` → `alertsSupabase.updateAlert`.

4. **HistoryBuyerView.jsx**
   - `base44.entities.ParkingAlert.update` → `alertsSupabase.updateAlert`.
   - `base44.entities.ChatMessage.create` se mantiene (chat no migrado).

5. **alertsSupabase.js**
   - Añadida `getAlertsReservedByMe(buyerId)` para "Tus reservas".
   - `normalizeAlert` ampliado con `available_in_minutes`, `cancel_reason`, `created_date`, `reserved_by_id`.

### Comportamiento visual

Se mantiene exactamente el mismo: tabs Tus alertas / Tus reservas, cancelar, expirar, repetir, prorrogar, "Me voy".

---

## 5. Próximos pasos (resto de componentes)

1. Home.jsx: sustituir create, filter, update (no tocar según instrucciones).
2. Notifications.jsx, Chats.jsx, Navigate.jsx, IncomingRequestModal, WaitMeRequestScheduler, SellerLocationTracker, ActiveAlertCard.
3. Una vez migrado todo, eliminar imports de Base44 relacionados con ParkingAlert.

---

## 6. Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/20260305170000_add_geohash_and_reservation_trigger.sql` | Creado |
| `src/services/alertsSupabase.js` | Creado, ampliado |
| `src/hooks/useMyAlerts.js` | Migrado a Supabase |
| `src/pages/History.jsx` | Migrado a Supabase |
| `src/pages/HistorySellerView.jsx` | Migrado a Supabase |
| `src/pages/HistoryBuyerView.jsx` | Migrado a Supabase (alertas; chat sigue Base44) |
| `docs/MIGRATION_ALERTS.md` | Actualizado |

**Base44 no se ha eliminado.** History.jsx usa Supabase para alertas; Transaction y Chat siguen en Base44.
