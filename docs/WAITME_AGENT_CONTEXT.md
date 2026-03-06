# WaitMe — Contexto del Agente Maestro

Documento de contexto permanente para que cualquier agente o IA entienda el proyecto completo.

---

## 1. Visión del proyecto

**Qué es WaitMe:** Marketplace de alertas de aparcamiento en tiempo real.

Los vendedores publican que van a dejar su plaza (precio, tiempo). Los compradores buscan plazas cercanas, reservan y coordinan la entrega. La app muestra mapas, chats y notificaciones en tiempo real.

---

## 2. Stack tecnológico

### Frontend
- **React** — UI
- **Vite** — Build y dev server
- **Tailwind** — Estilos
- **Zustand** — Estado global (appStore)
- **React Query** — Cache y fetching
- **React Router** — Navegación
- **Framer Motion** — Animaciones
- **Mapbox GL** — Mapas

### Backend
- **Supabase** — BaaS
- **Postgres** — Base de datos
- **Supabase Auth** — OAuth (Google, Apple)
- **Supabase Realtime** — Suscripciones en vivo
- **Supabase Storage** — Avatares y adjuntos

### Infraestructura
- **GitHub** — Repositorio
- **GitHub Actions** — CI (lint, typecheck, build)
- **Mapbox** — Tiles y geolocalización
- **Capacitor** — Empaquetado iOS

---

## 3. Arquitectura general

```
Usuario
   ↓
App React (src/)
   ↓
Adapters (src/data/*.js)
   ↓
Servicios Supabase (src/services/*Supabase.js)
   ↓
Supabase API (Postgres, Auth, Realtime, Storage)
   ↓
Realtime events
   ↓
Actualización UI (React Query, Zustand)
```

Los componentes **nunca** llaman a Supabase directamente. Usan adapters en `src/data/`.

---

## 4. Dominios del sistema

| Dominio | Qué hace |
|---------|----------|
| **Auth** | Login OAuth, sesión, signOut. Supabase Auth. |
| **Profiles** | Perfil de usuario: nombre, vehículo, preferencias, avatar. |
| **Parking Alerts** | Alertas de parking: vendedor publica (precio, ubicación, tiempo). |
| **Reservations** | Reservas de alertas: comprador reserva, estados (requested, accepted, active, completed). |
| **Chat** | Conversaciones y mensajes entre buyer y seller por alerta. |
| **Notifications** | Notificaciones del usuario (solicitudes, mensajes, etc.). |
| **Transactions** | Transacciones de pago entre buyer y seller. |
| **Maps** | Mapas Mapbox: ubicación, marcadores, rutas. Requiere token. |

---

## 5. Tablas Supabase

| Tabla | Para qué sirve |
|-------|----------------|
| `profiles` | Datos de usuario (nombre, vehículo, preferencias, avatar_url). |
| `parking_alerts` | Alertas de parking (seller_id, ubicación, precio, status, metadata). |
| `alert_reservations` | Reservas de alertas (buyer_id, alert_id, status, started_at, expires_at). |
| `conversations` | Conversaciones entre buyer y seller por alert_id. |
| `messages` | Mensajes de chat (conversation_id, sender_id, body). |
| `notifications` | Notificaciones del usuario (user_id, tipo, leído). |
| `transactions` | Transacciones (buyer_id, seller_id, alert_id, amount, status). |
| `user_location_updates` | Ubicación del comprador en ruta hacia la plaza. |
| Storage `avatars` | Avatares de perfil. |

---

## 6. Pantallas principales

| Pantalla | Función |
|----------|---------|
| **Home** | Landing: mapa fullscreen, botones "¿Dónde quieres aparcar?" y "¡Estoy aparcado aquí!". Modos search y create. |
| **History** | Lista de alertas del usuario (como vendedor o comprador). Estados: activa, reservada, en curso, finalizada. |
| **Chats** | Lista de conversaciones. Demo + real. |
| **Chat** | Chat individual con buyer/seller. Mensajes en tiempo real. |
| **Notifications** | Centro de notificaciones. |
| **Profile** | Perfil de usuario, edición de datos y vehículo. |
| **Settings** | Ajustes generales. |
| **Navigate** | Navegación hacia la plaza reservada. Mapa con ubicación del vendedor y comprador. |

---

## 7. Componentes críticos

| Componente | Función |
|-------------|---------|
| **MapboxMap** | Mapa fullscreen en Home. Marcadores de alertas y usuario. ResizeObserver, 100dvh. |
| **ParkingMap** | Mapas en modos search/create de Home y en Navigate. |
| **DemoFlowManager** | Gestiona flujo demo: alertas, conversaciones, notificaciones en memoria/localStorage. |
| **IncomingRequestModal** | Modal de solicitud WaitMe entrante. Aceptar/rechazar. |
| **WaitMeRequestScheduler** | Dispara petición demo 30s tras publicar alerta. |
| **appStore** (Zustand) | Estado global: alertas visibles, etc. |
| **finalizedAtStore** | Timestamps de alertas finalizadas (localStorage). |

---

## 8. Variables de entorno

| Variable | Qué hace |
|----------|----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (ej. `https://xxx.supabase.co`). Obligatoria para auth y datos. |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública de Supabase. Obligatoria. |
| `VITE_MAPBOX_TOKEN` | Token público Mapbox (pk.xxx). Obligatoria para mapas. |
| `VITE_SENTRY_DSN` | Opcional. Errores a Sentry. |
| `VITE_PUBLIC_APP_URL` | Opcional. URL para redirect OAuth. |

---

## 9. Reglas del proyecto

- **No tocar Home.jsx** sin orden explícita.
- **No modificar visuales** no pedidos.
- **Supabase** es la única fuente de verdad para datos persistentes.
- **No crear mocks** si existe flujo real en Supabase.
- **Mantener enfoque mobile-first.**
- Documentar archivos tocados, riesgos y prueba recomendada.
- Preferir cambios mínimos, limpios y reversibles.
- No crear duplicidades de servicios, hooks o stores.
- No romper History.jsx, chats, mapas ni flujo principal.

Ver `docs/CURSOR_RULES_WAITME.md` y `docs/SAFE_CHANGE_PROTOCOL.md`.

---

## 10. CI/CD

| Elemento | Descripción |
|----------|-------------|
| **GitHub Actions** | Workflow `ci.yml` en push/PR a `main`. |
| **build** | `npm run build` — Vite build de producción. |
| **lint** | `npm run lint` — ESLint. |
| **typecheck** | `npm run typecheck` — `tsc --noEmit`. |
| **Secrets** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN` en GitHub. |

Ver `docs/CI_SETUP.md`.
