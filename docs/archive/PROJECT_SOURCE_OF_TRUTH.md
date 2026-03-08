# WaitMe — Fuente de verdad del proyecto

Documento único de referencia para dominios, tablas, pantallas, servicios y configuración.

---

## 1. Dominios del sistema

| Dominio | Descripción |
|---------|-------------|
| **Auth** | Autenticación OAuth (Supabase Auth) |
| **Profiles** | Perfil de usuario (vehículo, datos, preferencias) |
| **Alertas** | Alertas de parking (vendedor publica, comprador reserva) |
| **Reservas** | Reservas de alertas (alert_reservations) |
| **Chat** | Conversaciones y mensajes entre buyer/seller |
| **Notifications** | Notificaciones del usuario |
| **Transactions** | Transacciones de pago |
| **Uploads** | Archivos (avatar, adjuntos) en Storage |
| **User Locations** | Ubicación del comprador en ruta |

---

## 2. Tablas Supabase por dominio

| Dominio | Tabla(s) |
|---------|----------|
| Auth | `auth.users` (Supabase) |
| Profiles | `profiles` |
| Alertas | `parking_alerts` |
| Reservas | `alert_reservations` |
| Chat | `conversations`, `messages` |
| Notifications | `notifications` |
| Transactions | `transactions` |
| Uploads | Storage bucket `avatars` |
| User Locations | `user_location_updates` |

---

## 3. Pantallas y rutas

| Ruta | Pantalla | Dominios usados |
|------|----------|-----------------|
| `/` | Home | Alertas, Map, Notifications |
| `/chats` | Chats | Chat, Alertas |
| `/chat/:id` | Chat | Chat, Notifications |
| `/notifications` | Notifications | Notifications |
| `/notification-settings` | NotificationSettings | Profiles |
| `/profile` | Profile | Profiles, Uploads |
| `/settings` | Settings | — |
| `/history` | History (Alertas) | Alertas, Transactions, Chat |
| `/navigate` | Navigate | Alertas, User Locations |

---

## 4. Servicios y adapters

Los componentes usan **adapters** en `src/data/*.js`; nunca llaman a Supabase directamente.

| Adapter | Servicio real | Tablas |
|---------|---------------|--------|
| `data/alerts` | `alertsSupabase` | parking_alerts, alert_reservations |
| `data/chat` | `chatSupabase` | conversations, messages |
| `data/notifications` | `notificationsSupabase` | notifications |
| `data/profiles` | `profilesSupabase` | profiles |
| `data/transactions` | `transactionsSupabase` | transactions |
| `data/uploads` | `uploadsSupabase` | Storage avatars |
| `data/userLocations` | `userLocationsSupabase` | user_location_updates |

---

## 5. Real vs demo

| Área | Real | Demo |
|------|------|------|
| **Auth** | Supabase Auth | — |
| **Alertas** | Supabase `parking_alerts` | `getMockNearbyAlerts()` en Home (modo búsqueda) |
| **Chat** | Supabase `conversations`, `messages` | `DemoFlowManager`, localStorage `waitme:demo_conversations` |
| **Notifications** | Supabase `notifications` | `getDemoNotifications()` |
| **History** | Supabase | `waitme:thinking_requests`, `waitme:rejected_requests` (localStorage) |
| **IncomingRequestModal** | Supabase | Crea conversaciones demo en localStorage |
| **Navigate** | Supabase | `alert.id.startsWith('demo_')` para datos fake |

**Demo:** Flujo simulado para aceptar WaitMe, chats, notificaciones. Usa `DemoFlowManager`, localStorage y datos mock en `mockNearby.js`.

---

## 6. Variables de entorno

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Anon key de Supabase |
| `VITE_MAPBOX_TOKEN` | Sí | Token Mapbox (mapa) |
| `VITE_SENTRY_DSN` | No | Opcional, errores |
| `VITE_PUBLIC_APP_URL` | No | Opcional, redirect OAuth |

---

## 7. Componentes de mapa

| Componente | Uso | Pantalla |
|------------|-----|----------|
| `MapboxMap` | Fondo fullscreen | Home |
| `ParkingMap` | Mapas en modos search/create | Home |
| `SellerLocationTracker` | Mapa del comprador en ruta | Navigate |

Todos requieren `VITE_MAPBOX_TOKEN` válido.
