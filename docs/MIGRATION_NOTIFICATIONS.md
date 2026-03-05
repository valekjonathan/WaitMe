# Migración Notifications: Base44 → Supabase

## Objetivo

Sustituir `base44.entities.Notification` por Supabase. Los componentes importan `import * as notifications from "@/data/notifications"` y nunca llaman a Base44 ni Supabase directamente para notificaciones.

## Archivos creados/modificados

### Nuevos

- **`src/data/notifications.js`** – Adapter que reexporta el proveedor actual (notificationsSupabase).
- **`src/services/notificationsSupabase.js`** – Proveedor Supabase para notificaciones.
- **`supabase/migrations/20260305210000_notifications.sql`** – Crea tabla `notifications` y políticas RLS.

### Modificados

- **`src/pages/Chats.jsx`** – Usa `notifications.createNotification` para prórrogas (extension_request) en lugar de Base44.
- **`src/pages/Home.jsx`** – Usa `notifications.listNotifications` y `subscribeNotifications` para el badge de no leídas.
- **`src/pages/Notifications.jsx`** – Usa `notifications.listNotifications`, `markAsRead`, `markAllAsRead`; combina con demo.

## API del adapter (`src/data/notifications.js`)

| Función | Descripción |
|---------|-------------|
| `createNotification(payload)` | Crea una notificación. Payload: `{ user_id, type, title?, message?, metadata? }`. |
| `listNotifications(userId, opts)` | Lista notificaciones. Opts: `{ unreadOnly?: boolean, limit?: number }`. |
| `markAsRead(notificationId, userId)` | Marca una notificación como leída. |
| `markAllAsRead(userId)` | Marca todas como leídas. |
| `subscribeNotifications(userId, onNotification)` | Suscripción Realtime a nuevas notificaciones. Devuelve función unsubscribe. |

## Tabla Supabase `notifications`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK, auto |
| user_id | uuid | FK auth.users, destinatario |
| type | text | extension_request, status_update, etc. |
| title | text | Título |
| message | text | Cuerpo |
| metadata | jsonb | Datos extra (sender_id, alert_id, amount, etc.) |
| is_read | boolean | Leída |
| created_at | timestamptz | Fecha |

## RLS

- **SELECT**: solo las propias (`user_id = auth.uid()`)
- **INSERT**: permitido (cualquier usuario puede crear notificaciones para otros)
- **UPDATE**: solo las propias

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| `Notification.create({ type, recipient_id, sender_id, alert_id, ... })` | `createNotification({ user_id: recipient_id, type, title, message, metadata: { sender_id, alert_id, ... } })` |
| `Notification.filter({ user_id, read: false })` | `listNotifications(userId, { unreadOnly: true })` |

## Ejecutar migración

```bash
npx supabase db push
```
