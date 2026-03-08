# AUDITORÍA EXHAUSTIVA + PLAN MIGRACIÓN SUPABASE — WaitMe

**Objetivo:** Dejar WaitMe con arquitectura profesional y migración completa a Supabase, estable y escalable.

---

## 1. MAPA DE ARQUITECTURA ACTUAL

### 1.1 Auth

| Componente | Archivo | Líneas | Descripción |
|-------------|---------|--------|-------------|
| AuthProvider | `src/lib/AuthContext.jsx` | 6-185 | Estado: `user`, `profile`, `setProfile`, `isAuthenticated`, `isLoadingAuth`, `authError` |
| ensureUserInDb | `src/lib/AuthContext.jsx` | 13-60 | Crea/lee fila en `profiles`, devuelve `user` fusionado con DB |
| resolveSession | `src/lib/AuthContext.jsx` | 62-105 | `getUser()` → `ensureUserInDb` → `setUser` + `setProfile` |
| onAuthStateChange | `src/lib/AuthContext.jsx` | 109-139 | INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT |
| logout | `src/lib/AuthContext.jsx` | 147-156 | Limpia estado, `signOut()`, redirect opcional |
| Login | `src/pages/Login.jsx` | - | OAuth Supabase (Google/Apple) |
| AuthRouter | `src/App.jsx` | 9-24 | Si `!user?.id` → Login; si no → Layout + modales |

**Flujo:** `supabase.auth.getUser()` → `ensureUserInDb` → `setUser(appUser)` + `setProfile(profileData)` desde `profiles`.

### 1.2 Layout, Rutas y Guards

| Componente | Archivo | Líneas | Descripción |
|-------------|---------|--------|-------------|
| LayoutProvider | `src/lib/LayoutContext.jsx` | 5-24 | `headerConfig`, `profileFormData`, `setProfileFormData` |
| LayoutShell | `src/Layout.jsx` | 44-72 | Header + main + BottomNav + ProfileGuard |
| ProfileGuard | `src/Layout.jsx` | 34-42 | Si `isHome && user?.id && !isProfileComplete(profile)` → `<Navigate to="/profile" />` |
| useProfileGuard | `src/hooks/useProfileGuard.ts` | 4-35 | Callback que valida `getMissingProfileFields`, muestra alert si incompleto |
| Header | `src/components/Header.jsx` | 46-56 | `guardSource = isOnProfile && formData ? formData : profile`; `guard` envuelve onBack y clicks |
| BottomNav | `src/components/BottomNav.jsx` | 22-24 | Mismo `guardSource` y `guard` para Mapa, Alertas, Chats |

**Rutas** (`src/Layout.jsx` 78-92): `/`, `/home`, `/chats`, `/chat`, `/chat/:id`, `/notifications`, `/notification-settings`, `/profile`, `/settings`, `/history`, `/alertas`, `/navigate`.

### 1.3 Estado Global

| Provider | Archivo | Estado |
|----------|---------|--------|
| AuthProvider | `src/lib/AuthContext.jsx` | `user`, `profile`, `setProfile`, `isAuthenticated`, `isLoadingAuth`, `authError`, `logout`, `checkUserAuth` |
| LayoutProvider | `src/lib/LayoutContext.jsx` | `headerConfig`, `setHeader`, `profileFormData`, `setProfileFormData` |
| QueryClientProvider | `src/main.jsx` | TanStack Query |

**Árbol de providers** (`src/main.jsx`): `ErrorBoundary` → `QueryClientProvider` → `AuthProvider` → `HashRouter` → `App`.

### 1.4 DemoFlow

| Componente | Archivo | Líneas | Descripción |
|-------------|---------|--------|-------------|
| DemoFlowManager | `src/components/DemoFlowManager.jsx` | - | `demoFlow` (users, alerts, conversations, messages, notifications) |
| isDemoMode() | `src/components/DemoFlowManager.jsx` | 244-251 | `?demo=1` en URL |
| startDemoFlow | `src/components/DemoFlowManager.jsx` | 254-265 | Comentado; demo desactivado |
| WaitMeRequestScheduler | `src/components/WaitMeRequestScheduler.jsx` | - | 30s tras publicar → mock request |
| IncomingRequestModal | `src/components/IncomingRequestModal.jsx` | - | Aceptar/rechazar WaitMe |

**Nota:** Demo usa `localStorage` (`waitme:demo_conversations`, `waitme:thinking_requests`, etc.) y base44 para algunas operaciones.

### 1.5 Páginas

| Página | Archivo | Responsabilidad principal |
|--------|---------|---------------------------|
| Home | `src/pages/Home.jsx` | Mapa, búsqueda, crear alerta, publicar, mock nearby |
| Chats | `src/pages/Chats.jsx` | Lista conversaciones, base44 + localStorage demo |
| Chat | `src/pages/Chat.jsx` | Chat individual, base44 o demo |
| History | `src/pages/History.jsx` | Tabs: Activas, Reservas, Finalizadas |
| HistorySellerView | `src/pages/HistorySellerView.jsx` | Alertas vendedor |
| HistoryBuyerView | `src/pages/HistoryBuyerView.jsx` | Reservas comprador |
| Profile | `src/pages/Profile.jsx` | Formulario, autosave Supabase `profiles` |
| Settings | `src/pages/Settings.jsx` | Ajustes |
| Notifications | `src/pages/Notifications.jsx` | Notificaciones + waitme requests |
| NotificationSettings | `src/pages/NotificationSettings.jsx` | Preferencias vía base44 |
| Navigate | `src/pages/Navigate.jsx` | Navegación, liberación de pago |
| Login | `src/pages/Login.jsx` | OAuth Supabase |

### 1.6 Componentes Clave

| Componente | Archivo | Rol |
|-------------|---------|-----|
| Header | `src/components/Header.jsx` | Título, atrás, balance, settings, perfil |
| BottomNav | `src/components/BottomNav.jsx` | Alertas, Mapa, Chats |
| CreateAlertCard | `src/components/cards/CreateAlertCard.jsx` | Form crear alerta |
| UserAlertCard | `src/components/cards/UserAlertCard.jsx` | Tarjeta alerta comprador |
| ActiveAlertCard | `src/components/cards/ActiveAlertCard.jsx` | Alerta activa vendedor |
| IncomingRequestModal | `src/components/IncomingRequestModal.jsx` | Aceptar/rechazar WaitMe |
| WaitMeRequestScheduler | `src/components/WaitMeRequestScheduler.jsx` | Mock request 30s |
| ParkingMap | `src/components/map/ParkingMap.jsx` | Mapa |
| MapFilters | `src/components/map/MapFilters.jsx` | Filtros mapa |

---

## 2. PROBLEMAS Y BUGS PROBABLES

### 2.1 Fuentes de verdad duplicadas

| Problema | Ubicación | Detalle |
|----------|-----------|---------|
| Auth dual | AuthContext vs base44 | Auth real: Supabase. base44 usa `access_token` de URL/localStorage (`app-params.js`). Chat, Navigate, IncomingRequestModal, NotificationSettings usan `base44.auth.me()` / `base44.auth.updateMe()`. Puede divergir. |
| Perfil triple | user, profile, formData | `user` = merge DB + auth; `profile` = Supabase profiles; `formData` = estado local Profile. `profileFormData` en LayoutContext es copia de `formData` para el guard. |
| notificaciones | Supabase vs base44 | `profiles.notifications_enabled` en Supabase; `base44.auth.updateMe()` en NotificationSettings. |

### 2.2 Guards

| Problema | Ubicación | Detalle |
|----------|-----------|---------|
| ProfileGuard usa profile | `Layout.jsx` 38 | Correcto tras fix. Antes usaba `user` (stale). |
| guardSource complejo | Header/BottomNav | `isOnProfile && formData ? formData : profile`. Si `formData` es null al montar, usa `profile`. |

### 2.3 Race conditions

| Problema | Ubicación | Detalle |
|----------|-----------|---------|
| resolveSession + onAuthStateChange | `AuthContext.jsx` 107-139 | Ambos corren al montar. Ambos pueden llamar `ensureUserInDb` y `setProfile`. |
| Profile save + unmount save | `Profile.jsx` 91-131 | Autosave y cleanup pueden ejecutarse casi a la vez. |
| Profile setProfile → hydration | `Profile.jsx` | `save()` → `setProfile(data)` → `profile` cambia → hydration → `setFormData` → nuevo autosave. |

### 2.4 useEffect peligrosos

| Problema | Archivo | Líneas | Detalle |
|----------|---------|--------|---------|
| Autosave sin debounce | `Profile.jsx` | 91-110 | Cada cambio de `formData` dispara save. Muchas peticiones al escribir. |
| Cleanup con setProfile | `Profile.jsx` | 117-131 | Cleanup llama `setProfile` tras unmount. Puede actualizar estado en componente desmontado. |
| profileFormData sync | `Profile.jsx` | 112-115 | `setProfileFormData(formData)` en cada cambio. Re-renders en Header/BottomNav. |

### 2.5 Loops y re-renders

| Problema | Ubicación | Detalle |
|----------|-----------|---------|
| Profile save loop | `Profile.jsx` | `formData` → save → `setProfile` → `profile` → hydration → `setFormData` → `formData` → save. Si hay diferencias de formato puede ciclar. |
| appParams | `src/lib/app-params.js` | `getAppParams()` escribe en localStorage en cada llamada. Objeto `appParams` se crea una vez al importar. |

### 2.6 Estados mezclados

| Problema | Ubicación | Detalle |
|----------|-----------|---------|
| user vs profile | AuthContext | `user` incluye datos de perfil; `profile` es la fuente real. `user` no se actualiza al guardar. |
| Demo vs real | Chats, History | localStorage para demo; base44 para real. Lógica bifurcada. |

### 2.7 Side effects

| Problema | Ubicación | Detalle |
|----------|-----------|---------|
| Avatar URL | `Profile.jsx` | `handlePhotoUpload` guarda URL completa. `profiles.avatar_url` puede esperar path de storage. |
| transactionEngine | `src/lib/transactionEngine.js` | Balance en memoria. No persiste en Supabase. |

### 2.8 Bug demo

| Problema | Ubicación | Detalle |
|----------|-----------|---------|
| demoOtherUser | `Chat.jsx` 75-78 | `demoConv.otherUserId` no existe; usa `participant2_id`. `users` es array, no mapa por id. |

---

## 3. DISEÑO FINAL RECOMENDADO

### 3.1 Una sola fuente de verdad

- **Sesión:** Supabase Auth. JWT de Supabase como único token.
- **Perfil:** Tabla `profiles` en Supabase. `profile` en AuthContext como única fuente. `formData` solo estado temporal en Profile.
- **base44:** Eliminar o usar Supabase JWT como token. Si se mantiene, que sea capa sobre Supabase.

### 3.2 Patrón de datos

```
AuthContext:
  - user (id, email) — solo identidad
  - profile — datos de perfil desde Supabase
  - setProfile — solo tras guardar en Supabase

Profile.jsx:
  - formData — estado local del formulario
  - Hidratar desde profile al montar
  - Autosave con debounce (300–500 ms)
  - Al guardar: Supabase → setProfile(data)
```

### 3.3 Hooks propuestos

| Hook | Propósito |
|------|------------|
| `useProfile()` | `profile` + `setProfile` desde AuthContext |
| `useProfileGuard(source)` | Guard con mensaje unificado (ya existe) |
| `useDebouncedSave(formData, delay)` | Autosave con debounce |
| `useAlerts(userId)` | Alertas del usuario (reemplazar useMyAlerts si cambia backend) |

### 3.4 Servicios

| Servicio | Archivo propuesto | Responsabilidad |
|----------|-------------------|-----------------|
| profileService | `src/services/profileService.js` | `getProfile(id)`, `updateProfile(id, data)` |
| alertService | `src/services/alertService.js` | CRUD alertas (Supabase o base44) |
| authService | `src/lib/supabaseAuth.js` | Encapsular auth Supabase |

---

## 4. PLAN DE MIGRACIÓN POR FASES

### Fase 0: Preparación (sin cambios de UI)

| Paso | Acción | Archivos | Riesgo |
|------|--------|----------|--------|
| 0.1 | Crear esquema Supabase completo | `supabase/migrations/` | Bajo |
| 0.2 | Documentar API base44 actual | - | Bajo |
| 0.3 | Definir mapeo base44 → Supabase | - | Bajo |

### Fase 1: Consolidar Auth y Perfil

| Paso | Acción | Archivos a tocar | Riesgo |
|------|--------|------------------|--------|
| 1.1 | Eliminar dependencia de base44 para auth | `src/lib/app-params.js`, `src/api/base44Client.js` | Alto |
| 1.2 | Pasar JWT Supabase a base44 (si se mantiene) | `base44Client.js`, `AuthContext.jsx` | Medio |
| 1.3 | Debounce en autosave Profile | `Profile.jsx` 91-110 | Bajo |
| 1.4 | Quitar save en cleanup o hacerlo condicional | `Profile.jsx` 117-131 | Medio |
| 1.5 | Unificar ProfileGuard en `profile` | `Layout.jsx` (ya hecho) | - |

### Fase 2: Migrar Alertas a Supabase

| Paso | Acción | Archivos a tocar | Riesgo |
|------|--------|------------------|--------|
| 2.1 | Crear tabla `parking_alerts` | `supabase/migrations/` | Bajo |
| 2.2 | Crear servicio `alertService` | `src/services/alertService.js` | Bajo |
| 2.3 | Sustituir `base44.entities.ParkingAlert` por Supabase | `Home.jsx`, `History.jsx`, `useMyAlerts.js`, etc. | Alto |
| 2.4 | Ajustar RLS y políticas | `supabase/migrations/` | Medio |

### Fase 3: Migrar Chats y Transacciones

| Paso | Acción | Archivos a tocar | Riesgo |
|------|--------|------------------|--------|
| 3.1 | Crear tablas `conversations`, `chat_messages` | `supabase/migrations/` | Bajo |
| 3.2 | Crear tabla `transactions` | `supabase/migrations/` | Bajo |
| 3.3 | Sustituir base44 en Chats | `Chats.jsx`, `Chat.jsx` | Alto |
| 3.4 | Sustituir base44 en Navigate | `Navigate.jsx` | Medio |
| 3.5 | Migrar transactionEngine a Supabase | `transactionEngine.js`, History | Alto |

### Fase 4: Limpieza y Optimización

| Paso | Acción | Archivos a tocar | Riesgo |
|------|--------|------------------|--------|
| 4.1 | Eliminar base44 si ya no se usa | `api/`, `app-params.js` | Medio |
| 4.2 | Refactorizar DemoFlow a Supabase o mock | `DemoFlowManager.jsx`, `Chat.jsx` | Medio |
| 4.3 | Error boundaries por sección | `App.jsx`, Layout | Bajo |

### Cómo probar cada fase

- Después de cada paso: login, logout, navegación, guard de perfil.
- Fase 1: crear/editar perfil, guardar, recargar.
- Fase 2: crear alerta, publicar, ver en History, reservar.
- Fase 3: chat, reserva, pago, transacciones.
- Fase 4: flujo completo sin base44.

---

## 5. ESQUEMA SUPABASE PROPUESTO

### 5.1 Tablas mínimas

#### `profiles` (existente, ajustada)

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  display_name text,
  brand text,
  model text,
  color text default 'gris',
  vehicle_type text default 'car',
  plate text,
  phone text,
  allow_phone_calls boolean default false,
  notifications_enabled boolean default true,
  email_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
```

#### `parking_alerts` (nueva)

```sql
create table public.parking_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_email text,
  user_name text,
  user_photo text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  price numeric(10,2) not null,
  available_in_minutes integer not null,
  brand text,
  model text,
  color text,
  vehicle_type text default 'car',
  plate text,
  phone text,
  allow_phone_calls boolean default false,
  status text not null default 'active',
  reserved_by_id uuid,
  reserved_by_email text,
  reserved_by_name text,
  reserved_by_photo text,
  reserved_by_car text,
  reserved_by_car_color text,
  reserved_by_plate text,
  reserved_by_vehicle_type text,
  wait_until timestamptz,
  created_from text,
  created_date timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_parking_alerts_user_id on public.parking_alerts(user_id);
create index idx_parking_alerts_status on public.parking_alerts(status);
create index idx_parking_alerts_created_date on public.parking_alerts(created_date desc);

alter table public.parking_alerts enable row level security;
create policy "Users can view own alerts" on public.parking_alerts for select using (auth.uid() = user_id or auth.uid() = reserved_by_id);
create policy "Users can create own alerts" on public.parking_alerts for insert with check (auth.uid() = user_id);
create policy "Users can update own or reserved alerts" on public.parking_alerts for update using (auth.uid() = user_id or auth.uid() = reserved_by_id);
create policy "Users can delete own alerts" on public.parking_alerts for delete using (auth.uid() = user_id);
```

#### `conversations` (nueva)

```sql
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.parking_alerts(id) on delete cascade,
  participant1_id uuid,
  participant1_name text,
  participant1_photo text,
  participant2_id uuid,
  participant2_name text,
  participant2_photo text,
  last_message_text text,
  last_message_at timestamptz,
  unread_count_p1 integer default 0,
  unread_count_p2 integer default 0
);

create index idx_conversations_alert_id on public.conversations(alert_id);

alter table public.conversations enable row level security;
create policy "Participants can view their conversations" on public.conversations for select
  using (auth.uid() = participant1_id or auth.uid() = participant2_id);
```

#### `chat_messages` (nueva)

```sql
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  alert_id uuid,
  sender_id uuid,
  sender_name text,
  sender_photo text,
  receiver_id uuid,
  message text,
  read boolean default false,
  message_type text default 'user',
  created_at timestamptz default now()
);

create index idx_chat_messages_conversation_id on public.chat_messages(conversation_id);

alter table public.chat_messages enable row level security;
create policy "Participants can view messages" on public.chat_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Participants can insert messages" on public.chat_messages for insert
  with check (auth.uid() = sender_id);
```

#### `transactions` (nueva)

```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.parking_alerts(id),
  buyer_id uuid references auth.users(id),
  seller_id uuid references auth.users(id),
  amount numeric(10,2) not null,
  status text not null default 'pending',
  buyer_name text,
  buyer_photo_url text,
  seller_name text,
  seller_photo_url text,
  buyer_brand text,
  buyer_model text,
  buyer_plate text,
  buyer_color text,
  seller_brand text,
  seller_model text,
  seller_plate text,
  seller_color text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_transactions_buyer_id on public.transactions(buyer_id);
create index idx_transactions_seller_id on public.transactions(seller_id);

alter table public.transactions enable row level security;
create policy "Users can view own transactions" on public.transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
```

### 5.2 Storage

- Bucket `avatars` con políticas de lectura pública y escritura autenticada.

---

## 6. CHECKLIST DE PRUEBAS MANUALES

### Auth y perfil

1. [ ] Login con Google redirige correctamente.
2. [ ] Login con Apple redirige correctamente.
3. [ ] Logout limpia sesión y redirige.
4. [ ] Perfil incompleto → redirección a /profile al ir a Home.
5. [ ] Perfil completo → navegación a Home sin redirección.
6. [ ] Guardar perfil actualiza datos al recargar.
7. [ ] Guard muestra mensaje correcto con campos faltantes.
8. [ ] Flecha atrás en Profile usa el mismo mensaje que guard global.

### Alertas

9. [ ] Crear alerta desde Home.
10. [ ] Publicar alerta y verla en Activas.
11. [ ] Reservar alerta como comprador.
12. [ ] Renovar alerta.
13. [ ] Cancelar alerta.
14. [ ] Ver alertas finalizadas.

### Chats

15. [ ] Abrir chat tras reserva.
16. [ ] Enviar mensaje.
17. [ ] Badge de no leídos.

### Navegación y pago

18. [ ] Navegar a ruta tras reserva.
19. [ ] Liberar pago tras llegar.
20. [ ] Balance se actualiza correctamente.

### Edge cases

21. [ ] Recargar en /profile mantiene datos.
22. [ ] Salir de Profile por BottomNav guarda cambios.
23. [ ] Sin conexión: mensaje de error esperado.

---

## 7. TRUCOS DE APPS GRANDES (priorizados)

| # | Técnica | Impacto | Prioridad | Aplicación en WaitMe |
|---|---------|---------|-----------|----------------------|
| 1 | Debounce en autosave | Alto | 1 | Profile.jsx: 300–500 ms |
| 2 | Optimistic updates | Alto | 2 | Crear/reservar alerta, actualizar UI antes de respuesta |
| 3 | Error boundaries | Alto | 3 | Envolver Layout, Chat, History |
| 4 | Toast/feedback | Medio | 4 | Sustituir `alert()` por toasts |
| 5 | Retry con backoff | Medio | 5 | Llamadas a Supabase en fallos de red |
| 6 | Cache (TanStack Query) | Medio | 6 | Ya usado; revisar staleTime |
| 7 | Offline básico | Medio | 7 | Queue de writes, sync al reconectar |
| 8 | Telemetry | Bajo | 8 | Eventos clave (login, reserva, pago) |
| 9 | Rate limiting | Bajo | 9 | Límite de requests por usuario |
| 10 | Skeleton loaders | Bajo | 10 | Profile, History, Chats |

---

## Resumen ejecutivo

- **Problemas críticos:** Auth dual (Supabase vs base44), autosave sin debounce, posibles race conditions en Profile.
- **Diseño objetivo:** Una sola fuente de verdad (Supabase), `profile` como fuente de perfil, debounce en autosave.
- **Migración:** 4 fases: 1) Auth + perfil, 2) Alertas, 3) Chats + transacciones, 4) Limpieza.
- **Esquema:** `profiles`, `parking_alerts`, `conversations`, `chat_messages`, `transactions` con RLS.
- **Pruebas:** 23 checks manuales en 5 categorías.
- **Optimizaciones:** Debounce, optimistic updates y error boundaries como primeras prioridades.
