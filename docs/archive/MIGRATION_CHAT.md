# Migración Chat: Base44 → Supabase (Data Adapter)

## Objetivo

Que el chat deje de depender de Base44 usando el patrón Data Adapter (Strangler). Los componentes importan `import * as chat from "@/data/chat"` y nunca llaman a Base44 ni Supabase directamente.

## Archivos creados/modificados

### Nuevos

- **`src/data/chat.js`** – Adapter que reexporta el proveedor actual (chatSupabase).
- **`src/services/chatSupabase.js`** – Proveedor Supabase para chat.
- **`supabase/migrations/20260305180000_conversations_last_message.sql`** – Añade `last_message_text`, `last_message_at` y trigger a `conversations`.

### Modificados

- **`src/pages/Chat.jsx`** – Usa `chat.*` y `useAuth` en lugar de Base44.
- **`src/pages/Chats.jsx`** – Usa `chat.getConversations` y `alerts.getAlertsForChats`.

## API del adapter (`src/data/chat.js`)

| Función | Descripción |
|---------|-------------|
| `getConversations(userId)` | Lista conversaciones del usuario (buyer o seller). |
| `getConversation(conversationId, userId)` | Obtiene una conversación por ID. |
| `getMessages(conversationId, userId)` | Mensajes de una conversación. |
| `sendMessage({ conversationId, senderId, body })` | Envía un mensaje. |
| `subscribeMessages(conversationId, onNewMessage)` | Suscripción Realtime a mensajes. |

## Tablas Supabase

- **`conversations`** – `id`, `alert_id`, `buyer_id`, `seller_id`, `created_at`, `last_message_text`, `last_message_at`.
- **`messages`** – `id`, `conversation_id`, `sender_id`, `body`, `created_at`.

El trigger `on_message_inserted` actualiza `last_message_text` y `last_message_at` al insertar un mensaje.

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| `participant1_id` | `buyer_id` |
| `participant2_id` | `seller_id` |
| `message` | `body` |
| `created_date` | `created_at` |
| `sender_name`, `sender_photo` | Desde `profiles` por `sender_id` |

## Realtime

Se usa `postgres_changes` en la tabla `messages` con filtro `conversation_id=eq.{id}`. La tabla `messages` debe estar en `supabase_realtime` (ya configurado en migraciones).

## Lo que sigue usando Base44

- **`base44.integrations.Core.UploadFile`** – Subida de adjuntos en Chat (no migrado).
- **`base44.entities.Notification.create`** – Prórrogas en Chats (no migrado).

## Ejecutar migración

```bash
npx supabase db push
```

O aplicar manualmente el SQL de `supabase/migrations/20260305180000_conversations_last_message.sql`.
