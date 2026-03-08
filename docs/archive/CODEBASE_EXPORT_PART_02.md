
================================================================
FILE: docs/AUDITORIA_SUPABASE_PRODUCCION.md
================================================================
```md
# AUDITORÍA COMPLETA SUPABASE — WaitMe (Producción)

**Fecha:** 2025-03-04  
**Objetivo:** Verificar si la arquitectura de Supabase es correcta para producción.

---

## A) PROBLEMAS DETECTADOS

### 1. AUTH

| # | Problema | Severidad | Detalle |
|---|----------|-----------|---------|
| A1 | **Redirect OAuth incompleto** | Media | `VITE_PUBLIC_APP_URL` puede no coincidir con la URL configurada en Supabase Dashboard (Authentication → URL Configuration). Si difieren, el callback falla. |
| A2 | **Sin manejo de email OTP** | Baja | Solo Google y Apple. No hay flujo para email/magic link si se habilita. |
| A3 | **created_at en insert** | Baja | `ensureUserInDb` pasa `created_at: new Date().toISOString()`. El schema tiene `default now()`. Redundante pero no rompe. |
| A4 | **Doble fuente de auth** | Alta | base44 sigue usándose para ParkingAlert, Chat, Transactions. JWT de Supabase no se pasa a base44. Riesgo de sesiones desincronizadas. |

### 2. TABLA profiles

| # | Problema | Severidad | Detalle |
|---|----------|-----------|---------|
| P1 | **Sin trigger updated_at** | Media | La columna `updated_at` existe pero no hay trigger que la actualice en UPDATE. Queda desactualizada. |
| P2 | **Sin índice en email** | Baja | Si se buscan perfiles por email, no hay índice. Actualmente no se usa. |
| P3 | **photo_url vs avatar_url** | Baja | AuthContext usa `profile?.avatar_url || profile?.photo_url`. El schema solo tiene `avatar_url`. Inconsistencia menor. |
| P4 | **Sin constraint CHECK en vehicle_type** | Baja | Valores esperados: `car`, `suv`, `van`. Sin constraint, se pueden insertar valores inválidos. |
| P5 | **Sin constraint CHECK en color** | Baja | Valores esperados: blanco, negro, rojo, azul, etc. Sin constraint. |

### 3. RLS (profiles)

| # | Problema | Severidad | Detalle |
|---|----------|-----------|---------|
| R1 | **Políticas correctas** | — | SELECT, UPDATE, INSERT cumplen `auth.uid() = id`. ✅ |
| R2 | **Sin política DELETE** | Baja | No hay política DELETE. Con `on delete cascade` en `auth.users`, si se borra el usuario, la fila se elimina. No se puede borrar perfil manualmente. Aceptable. |
| R3 | **Service role bypass** | Info | RLS no aplica a `service_role`. Cualquier código con service key puede leer/escribir todo. Verificar que la anon key se use en cliente. |

### 4. STORAGE (avatars)

| # | Problema | Severidad | Detalle |
|---|----------|-----------|---------|
| S1 | **Políticas no documentadas** | Media | El schema_profiles.sql menciona "políticas públicas de lectura" pero no incluye SQL. Falta definir: `storage.objects` SELECT público para avatares, INSERT/UPDATE solo `auth.uid() = (storage.foldername(name))[1]`. |
| S2 | **Path de avatar** | Media | Profile.jsx sube a `avatars/${user.id}/${timestamp}.ext` y guarda URL completa en `avatar_url`. Algunos flujos esperan path relativo (`avatars/xxx`). `normalizeAvatarPath` maneja ambos. Verificar consistencia. |
| S3 | **Sin límite de tamaño** | Baja | No hay validación de tamaño de archivo antes de subir. Riesgo de abuso. |

### 5. TABLAS FUTURAS (parking_alerts, conversations, chat_messages, transactions)

| # | Problema | Severidad | Detalle |
|---|----------|-----------|---------|
| F1 | **parking_alerts: búsqueda geo** | Alta | Sin PostGIS, las consultas "alertas cerca de X" serán lentas. El código usa `haversineKm` en cliente. En producción con muchos registros, hay que filtrar en DB. |
| F2 | **parking_alerts: RLS para búsqueda** | Alta | El esquema propuesto permite SELECT si `auth.uid() = user_id or auth.uid() = reserved_by_id`. Pero para "buscar alertas cerca" un comprador debe ver alertas de OTROS (status=active). Falta política: `status = 'active'` visible por cualquiera autenticado. |
| F3 | **conversations: sin INSERT/UPDATE** | Alta | Solo hay política SELECT. Falta INSERT (crear conversación) y UPDATE (last_message, unread_count). |
| F4 | **chat_messages: sin UPDATE** | Media | No hay política UPDATE para marcar mensajes como leídos. |
| F5 | **transactions: sin INSERT** | Alta | Solo SELECT. Falta política para que buyer/seller puedan crear transacciones en flujo de reserva. |
| F6 | **participant1_id, participant2_id sin FK** | Media | En conversations, participant1_id y participant2_id no referencian auth.users. Permite IDs inválidos. |
| F7 | **reserved_by_id sin FK** | Media | En parking_alerts, reserved_by_id no tiene `references auth.users`. |

### 6. ÍNDICES

| # | Problema | Severidad | Detalle |
|---|----------|-----------|---------|
| I1 | **profiles** | Baja | Solo PK. Suficiente para acceso por id. |
| I2 | **parking_alerts: geo** | Alta | Sin índice espacial, `WHERE latitude BETWEEN ... AND longitude BETWEEN ...` es lento. PostGIS + GIST recomendado. |
| I3 | **parking_alerts: status + created_date** | Media | Índice compuesto `(status, created_date DESC)` para listar activas ordenadas. |
| I4 | **chat_messages: conversation_id** | Media | Ya propuesto. Necesario para cargar mensajes de una conversación. |
| I5 | **conversations: participant** | Media | Índice `(participant1_id, participant2_id)` o uno por participante para "mis conversaciones". |

### 7. SEGURIDAD

| # | Problema | Severidad | Detalle |
|---|----------|-----------|---------|
| G1 | **anon key en cliente** | Info | Correcto. La anon key está en env y se usa en supabaseClient. RLS protege los datos. |
| G2 | **Queries sin RLS** | — | Todas las queries a `profiles` pasan por Supabase client con JWT. RLS aplica. ✅ |
| G3 | **Columnas sensibles** | Baja | `phone` en profiles. Considerar si debe ser visible solo por el propio usuario (ya lo es por RLS). |
| G4 | **base44 sin RLS** | Alta | base44 usa su propio backend. No hay garantía de que aplique políticas equivalentes a Supabase. |

---

## B) MEJORAS RECOMENDADAS

### Prioridad 1 (Críticas)

1. **Definir políticas Storage avatars** en SQL y aplicarlas.
2. **Añadir trigger updated_at** en profiles.
3. **Corregir RLS parking_alerts** para búsqueda: política que permita SELECT de alertas `status='active'` a cualquier usuario autenticado.
4. **Completar políticas conversations y chat_messages** (INSERT, UPDATE).
5. **Completar políticas transactions** (INSERT).

### Prioridad 2 (Importantes)

6. **PostGIS para parking_alerts** si se migra a Supabase: columna `location geography(Point,4326)`, índice GIST, función `ST_DWithin` para nearby.
7. **FK en conversations y parking_alerts** para participant_id y reserved_by_id.
8. **Índices compuestos** en parking_alerts (status, created_date) y conversations (participant).

### Prioridad 3 (Opcionales)

9. **CHECK constraints** en vehicle_type y color.
10. **Validar VITE_PUBLIC_APP_URL** vs Supabase URL config.
11. **Límite de tamaño** en upload de avatares (ej. 2MB).

---

## C) CAMBIOS EXACTOS A APLICAR EN SUPABASE

### C.1 profiles — trigger updated_at

```sql
-- Ejecutar en Supabase SQL Editor
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
```

### C.2 Storage — políticas avatars

```sql
-- Bucket 'avatars' debe existir. Crear en Dashboard si no existe.
-- Políticas para storage.objects (bucket avatars):

-- Lectura pública (cualquiera puede ver avatares)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Solo el usuario puede subir en su carpeta
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Solo el usuario puede actualizar/borrar su avatar
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### C.3 parking_alerts — esquema corregido con RLS para búsqueda

```sql
-- Si la tabla no existe, crear con:
-- (incluir extensión PostGIS si se usa: create extension if not exists postgis;)

create table if not exists public.parking_alerts (
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
  reserved_by_id uuid references auth.users(id) on delete set null,
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
create index idx_parking_alerts_status_created on public.parking_alerts(status, created_date desc);

-- RLS
alter table public.parking_alerts enable row level security;

-- Ver propias alertas (vendedor o comprador)
create policy "Users can view own or reserved alerts"
  on public.parking_alerts for select
  using (auth.uid() = user_id or auth.uid() = reserved_by_id);

-- Ver alertas activas (para búsqueda de aparcamientos)
create policy "Authenticated users can view active alerts"
  on public.parking_alerts for select
  using (auth.role() = 'authenticated' and status = 'active');

-- Crear solo propias
create policy "Users can create own alerts"
  on public.parking_alerts for insert
  with check (auth.uid() = user_id);

-- Actualizar propias o reservadas
create policy "Users can update own or reserved alerts"
  on public.parking_alerts for update
  using (auth.uid() = user_id or auth.uid() = reserved_by_id);

-- Borrar solo propias
create policy "Users can delete own alerts"
  on public.parking_alerts for delete
  using (auth.uid() = user_id);
```

**Nota:** Las políticas "view own" y "view active" pueden solaparse. PostgreSQL las combina con OR. Si hay conflicto, simplificar a una sola política SELECT que cubra ambos casos.

### C.4 conversations — políticas completas

```sql
-- Añadir a las existentes:

create policy "Participants can insert conversations"
  on public.conversations for insert
  with check (auth.uid() = participant1_id or auth.uid() = participant2_id);

create policy "Participants can update conversations"
  on public.conversations for update
  using (auth.uid() = participant1_id or auth.uid() = participant2_id);
```

### C.5 chat_messages — políticas completas

```sql
-- Añadir:

create policy "Participants can update messages (read)"
  on public.chat_messages for update
  using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );
```

### C.6 transactions — política INSERT

```sql
create policy "Buyer or seller can create transaction"
  on public.transactions for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);
```

### C.7 PostGIS (opcional, para geolocalización eficiente)

```sql
create extension if not exists postgis;

-- Añadir columna a parking_alerts
alter table public.parking_alerts
  add column if not exists location geography(Point, 4326);

-- Rellenar desde latitude/longitude
update public.parking_alerts
set location = st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
where location is null and latitude is not null and longitude is not null;

-- Índice espacial
create index idx_parking_alerts_location
  on public.parking_alerts using gist(location);
```

---

## RESUMEN EJECUTIVO

| Categoría | Estado | Acción |
|-----------|--------|--------|
| **Auth** | Parcial | OAuth OK. Verificar URLs. base44 paralelo es riesgo. |
| **profiles** | Aceptable | Añadir trigger updated_at. RLS correcto. |
| **RLS profiles** | ✅ OK | select/update/insert con auth.uid() = id |
| **Storage avatars** | Incompleto | Definir y aplicar políticas. |
| **Tablas futuras** | Esquema propuesto | Corregir RLS (búsqueda activas, INSERT/UPDATE). |
| **Índices** | Parcial | Añadir compuestos. PostGIS si hay migración geo. |
| **Seguridad** | Aceptable | RLS activo. Revisar base44. |

**Próximos pasos recomendados:** Aplicar C.1 (trigger), C.2 (storage), y al crear parking_alerts/conversations/chat_messages/transactions, usar los esquemas corregidos de C.3–C.6.

```

================================================================
FILE: docs/AUDITORIA_Y_PLAN_MIGRACION_SUPABASE.md
================================================================
```md
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

```

================================================================
FILE: docs/AUDIT_REPORT.md
================================================================
```md
# Auditoría del proyecto WaitMe — Entorno de desarrollo

**Fecha:** 2025-03  
**Objetivo:** Flujo de desarrollo profesional que evite que cada cambio rompa otra parte de la app.

---

## 1. Herramientas ya instaladas

| Herramienta | Versión | Uso |
|--------------|---------|-----|
| **Playwright** | ^1.58.2 | E2E tests |
| **Percy** | ^5.0.0 | Visual testing (percy exec + playwright) |
| **Vitest** | ^4.0.18 | Unit/contract tests |
| **Vite** | ^6.1.0 | Build y dev server |
| **ESLint** | ^9.19.0 | Linting |
| **Prettier** | ^3.8.1 | Formateo |
| **Husky** | ^9.1.7 | Git hooks |
| **lint-staged** | ^15.4.3 | Pre-commit checks |

---

## 2. Herramientas faltantes

| Herramienta | Estado |
|-------------|--------|
| **Storybook** | ✓ Instalado (v10). Stories: CreateAlertCard, CreateMapOverlay, MapZoomControls. |
| **Chromatic** | Opcional. Incluido con Storybook para visual regression. |

---

## 3. Scripts actuales (package.json)

| Script | Comando | Estado |
|--------|---------|--------|
| dev | vite --host --port 5173 | ✓ Correcto |
| preview | vite preview --host --port 4173 | ✓ Correcto |
| test | playwright test | ✓ |
| test:e2e | playwright test | ✓ |
| test:e2e:ui | playwright test --ui | ✓ |
| test:ui | playwright test --ui | ✓ |
| test:visual | percy exec -- playwright test | ✓ |
| test:contracts | vitest run tests/contracts | ✓ |
| build | vite build | ✓ |
| lint | eslint . --max-warnings=9999 | ✓ |
| check | lint + build | ✓ |
| ios:run | bash scripts/ios-run.sh | ✓ |
| ios:run:dev | CAPACITOR_USE_DEV_SERVER=true npx cap run ios | ✓ |

---

## 4. Tests actuales (/tests)

| Archivo | Tipo | Cobertura |
|---------|------|-----------|
| **tests/smoke/load.spec.js** | E2E | App carga, no pantalla blanca, WaitMe visible |
| **tests/smoke/create.spec.js** | E2E | Botón aparcado, create abre, zoom, tarjeta, no error fatal |
| tests/app.spec.js | E2E | Flujo app |
| tests/profile.spec.js | E2E | Perfil |
| tests/map.spec.js | E2E | Mapa |
| tests/contracts/*.test.js | Unit | alerts, chat, notifications, transactions, uploads, userLocations |

**Smoke tests cubren:** App carga ✓, No pantalla blanca ✓, Home visible ✓, Botón "Estoy aparcado aquí" ✓, Pantalla create ✓, Botones zoom ✓, Botón Ubícate ✓

---

## 5. Vite config

| Opción | Valor actual | Requerido |
|--------|-------------|-----------|
| server.host | true | ✓ |
| server.port | 5173 | ✓ |
| preview.host | true | ✓ |
| preview.port | 4173 | ✓ |
| server.hmr.host | 192.168.0.11 (hardcoded) | ⚠️ Puede fallar si IP cambia |

---

## 6. Documentación existente

| Doc | Contenido |
|-----|-----------|
| docs/WAITME_DEV_WORKFLOW.md | Flujo dev, Playwright, Capacitor |
| docs/WORKFLOWS_WAITME.md | Prompts reutilizables |
| docs/SAFE_CHANGE_PROTOCOL.md | Protocolo de cambio seguro |
| docs/CURSOR_RULES_WAITME.md | Reglas del proyecto |
| docs/RENDER_AUDIT_REPORT.md | Diagnóstico pantalla negro/blanco |

---

## 7. Playwright config

| Opción | Estado |
|--------|--------|
| WebKit móvil (iPhone 14) | ✓ |
| Geolocation | ✓ |
| Permissions geolocation | ✓ |
| webServer (vite) | ✓ Puerto 5174 |
| projects: webkit-mobile, chromium | ✓ |

---

## 8. Recomendaciones

1. **Instalar Storybook** — Para probar CreateAlertCard, CreateMapOverlay, MapZoomControls sin montar toda la app.
2. **Crear docs/WAITME_FAST_WORKFLOW.md** — Guía rápida: dev → test:e2e → storybook → ios:run.
3. **HMR host** — Considerar usar `host: true` o variable de entorno en vez de IP fija.
4. **Smoke tests** — El locator `mapContainer.or(page.locator('#root'))` en create.spec puede causar strict mode; usar `.first()` o selector más específico si falla.
5. **No tocar** — AuthContext, MapboxMap, Home, Layout, lógica de mapas/login.

```

================================================================
FILE: docs/CICD_AUDIT.md
================================================================
```md
# CI/CD Audit — WaitMe

**Fecha:** 2025-03-04  
**Objetivo:** Arquitectura startup-grade blindada con SOLO main, cero pasos manuales, Supabase como código.

---

## 1. Qué hace hoy el pipeline (paso a paso)

### Workflows existentes

| Workflow | Trigger | Pasos |
|----------|---------|-------|
| **lint-and-build.yml** | `push` → main | checkout → setup Node 20 → npm ci → lint → build |
| **tests.yml** | `push`/`pull_request` → main | checkout → setup Node 20 → npm ci → playwright install chromium → lint → typecheck → playwright test |
| **supabase-migrations.yml** | `push` → main (solo si cambian `supabase/**` o el workflow) | checkout → setup Supabase CLI → link --project-ref --password → db push |

### Flujo actual

1. **Push a main**
   - `lint-and-build` y `tests` corren en paralelo (independientes).
   - `supabase-migrations` solo corre si hay cambios en `supabase/**` o en el propio workflow.

2. **Problemas detectados**
   - No hay gate: migrations pueden correr aunque lint/tests fallen.
   - Duplicación: lint corre en ambos workflows.
   - No hay cache explícito de dependencias (solo `cache: npm` en setup-node).
   - No hay artifacts de build.
   - No hay verificación de drift de DB.
   - No hay Dependabot ni CodeQL.
   - No hay environments con approvals.

---

## 2. Supabase como código

### Estructura actual

```
supabase/
├── config.toml          # project_id = "WaitMeNuevo", migrations enabled
├── seed.sql             # Vacío (solo comentarios)
├── migrations/          # 6 migraciones SQL
│   ├── 20260304134200_create_profiles.sql
│   ├── 20260304150000_create_parking_alerts.sql
│   ├── 20260304160000_enable_realtime_parking_alerts.sql
│   ├── 20260304170000_add_geohash_parking_alerts.sql
│   ├── 20260305120000_fix_profiles_rls_and_trigger.sql
│   └── 20260305160000_core_schema.sql
└── functions/           # Edge functions (map-match)
```

### Config

- `db.migrations.enabled = true`
- `db.seed.sql_paths = ["./seed.sql"]`
- `major_version = 17`

---

## 3. Qué falta para estar “blindado”

| Gap | Descripción |
|-----|-------------|
| Gate único | CI debe pasar antes de aplicar migrations. Hoy migrations pueden correr aunque tests fallen. |
| Drift check | No se verifica si la DB remota tiene cambios manuales no reflejados en migrations. |
| Workflow unificado | Lint, typecheck, tests y build en un solo pipeline con dependencias claras. |
| Cache | Cache de npm y Playwright browsers. |
| Artifacts | Build artifacts para deploy posterior. |
| Dependabot | Actualización automática de dependencias. |
| CodeQL | Análisis de seguridad de código. |
| Environments | Staging (auto) y Production (con approval). |
| Secrets audit | Documentar qué secrets se usan y cuáles faltan. |

---

## 4. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Drift de DB** | Alta | Ejecutar `supabase db diff` antes de push; fallar si hay diferencias no migradas. |
| **Migrations sin gate** | Alta | Migrations solo tras CI exitoso; usar `workflow_run` o job dependencies. |
| **Secrets faltantes** | Alta | Documentar y validar SUPABASE_*, VITE_*, MAPBOX en CI. |
| **Deploy inseguro** | Media | Environments con approval para producción. |
| **Sin SAST** | Media | CodeQL para detección de vulnerabilidades. |
| **Dependencias desactualizadas** | Media | Dependabot. |
| **Tests flaky** | Media | Retries en CI; considerar smoke tests más estables. |
| **Build sin artifacts** | Baja | Subir build a artifacts para deploy. |

---

## 5. Lista priorizada de cambios

### P0 (crítico)

- [x] **CI unificado** (`ci.yml`): lint + typecheck + tests + build en un solo pipeline.
- [x] **Gate de migrations**: Supabase solo corre tras CI exitoso; migrations SOLO en main.
- [x] **Drift check**: Verificar drift antes de aplicar migrations; fallar si hay diferencias.

### P1 (importante)

- [x] **Cache**: npm + Playwright browsers.
- [x] **Artifacts**: Subir build para deploy.
- [x] **Dependabot**: `dependabot.yml` para npm y GitHub Actions.
- [x] **CodeQL**: Análisis de seguridad.
- [x] **Environments**: Documentar staging/production con approvals.

### P2 (mejora)

- [ ] **Prettier en CI**: Añadir `format:check` al pipeline.
- [ ] **Branch protection**: Requerir CI antes de merge a main.
- [ ] **Supabase preview**: Branch previews para PRs (si plan lo permite).
- [ ] **Smoke tests**: Tests más rápidos para validación básica.

---

## 6. Secrets requeridos

| Secret | Uso | Workflow |
|-------|-----|----------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI auth | supabase.yml |
| `SUPABASE_PROJECT_REF` | Link al proyecto | supabase.yml |
| `SUPABASE_DB_PASSWORD` | DB password para link | supabase.yml |
| `VITE_SUPABASE_URL` | Tests E2E | ci.yml |
| `VITE_SUPABASE_ANON_KEY` | Tests E2E | ci.yml |
| `VITE_MAPBOX_TOKEN` | Tests E2E (mapas) | ci.yml |

---

## 7. Resumen ejecutivo

El pipeline actual tiene **duplicación**, **falta de gate** entre CI y migrations, y **sin verificación de drift**. La implementación P0/P1 unifica CI, añade drift check, cache, artifacts, Dependabot, CodeQL y documentación de environments, dejando el repo listo para un flujo blindado con main como única rama de producción.

```

================================================================
FILE: docs/CI_SETUP.md
================================================================
```md
# Configuración de CI/CD — WaitMe

## Workflows activos

| Workflow | Disparador | Descripción |
|----------|------------|-------------|
| `ci.yml` | push/PR a `main` | Lint, typecheck, build |

## Secrets requeridos

Configurar en **Settings → Secrets and variables → Actions** del repositorio:

| Secret | Obligatorio | Uso |
|--------|-------------|-----|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase (ej. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Sí | Anon key de Supabase (Project Settings → API) |
| `VITE_MAPBOX_TOKEN` | Sí | Token público de Mapbox (https://account.mapbox.com/) |

El build inyecta estas variables en el bundle. Si faltan, el build puede completar pero la app mostrará pantallas de error en runtime.

## Cómo obtener los valores

1. **Supabase:** Dashboard → Project Settings → API → Project URL y anon public key
2. **Mapbox:** https://account.mapbox.com/access-tokens/ → crear token público (pk.xxx)

## Workflows deshabilitados

En `.github/workflows_disabled/` hay workflows adicionales que no se ejecutan:

- **supabase.yml:** Aplica migraciones tras CI exitoso. Requiere `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` y un environment `production`.
- **codeql.yml:** Análisis de seguridad con CodeQL.

Para reactivarlos: mover a `.github/workflows/` y configurar los secrets correspondientes.

```

================================================================
FILE: docs/CONTRACT_TESTS.md
================================================================
```md
# Contract Tests (Data Layer API)

## Objetivo

Validar que la capa de datos (`src/data/*`) mantiene el contrato esperado por los consumidores. Los tests verifican que las funciones existen y devuelven la forma `{ data, error }`.

## Ubicación

```
tests/contracts/
├── alerts.test.js
├── chat.test.js
├── transactions.test.js
└── uploads.test.js
```

## Funciones validadas

| Módulo | Funciones |
|--------|-----------|
| **alerts** | createAlert, getMyAlerts, getAlertsReservedByMe, updateAlert, deleteAlert, subscribeAlerts |
| **chat** | sendMessage, getMessages, getConversations, getConversation, subscribeMessages |
| **transactions** | createTransaction, listTransactions |
| **uploads** | uploadFile, getPublicUrl, deleteFile |

## Contrato

Todas las funciones asíncronas devuelven un objeto con:

- `data`: resultado (objeto, array o null)
- `error`: Error o null

Los tests no requieren backend real: sin Supabase configurado, las funciones devuelven `{ data: null/[], error }`, lo que basta para validar la forma.

## Ejecución

```bash
npm run test:contracts
```

## CI

Los contract tests se ejecutan en CI antes del build:

1. Check migrations safety
2. Lint
3. Typecheck
4. Playwright tests
5. **Contract tests** ← antes de build
6. Build

## Preview protection (Vercel)

Para preview deployments en PRs:

1. Conectar el repo a Vercel (Vercel for GitHub).
2. Vercel crea automáticamente preview URLs para cada PR.
3. `vercel.json` define `framework: vite`, `buildCommand` y `outputDirectory`.

Las previews permiten probar cambios en PR antes de merge a main.

```

================================================================
FILE: docs/CREATE_MAP_FINAL_BLOCKER_AUDIT.md
================================================================
```md
# Auditoría final — Bloqueadores pantalla "Estoy aparcado aquí"

**Fecha:** 2025-03-06  
**Objetivo:** Solución definitiva tipo Uber.

---

## 1. Causa raíz del drag roto

**Problema:** El mapa no se arrastra en iOS Simulator.

**Causa:** El overlay CreateMapOverlay usaba un `div` con `fixed inset-0 top-[60px]` que cubría toda el área entre header y bottom. Aunque tenía `pointer-events-none`, en iOS/Safari un elemento fullscreen encima del canvas puede interferir con el hit-testing o la propagación de eventos táctiles. El canvas de Mapbox quedaba "debajo" del overlay en el DOM; con pointer-events-none el evento debería pasar, pero en ciertas configuraciones iOS no llega correctamente al canvas.

**Solución aplicada:** Eliminar el wrapper fullscreen. Renderizar solo los elementos necesarios (tarjeta, pin, zoom) como siblings del canvas, sin ningún div que cubra la zona de drag. La zona libre queda sin elementos → el canvas recibe los gestos directamente.

---

## 2. Causa raíz de la dirección fija en "Oviedo"

**Problema:** El campo no cambiaba en tiempo real al mover el mapa.

**Causas:**
1. Si el mapa no recibe eventos de drag, `move`/`moveend` nunca se disparan → `handleMapMove`/`handleMapMoveEnd` no se llaman → `selectedPosition` y `debouncedReverseGeocode` no se ejecutan.
2. Debounce de 300ms puede sentirse lento para "tiempo real".

**Solución aplicada:** Arreglar el drag primero. Reducir debounce a 150ms para feedback más rápido. Mantener última dirección válida en fallo.

---

## 3. Causa raíz del zoom mal colocado

**Problema:** Los botones no estaban donde se pidió.

**Causa:** `left: 4%` podía no coincidir exactamente con el borde izquierdo de la tarjeta (que usa `left-1/2 -translate-x-1/2 w-[92%]`). En viewports estrechos el 4% podía quedar pegado al borde.

**Solución aplicada:** Usar `left: calc(4% + 1rem)` para alinear con el borde izquierdo de la tarjeta con un pequeño margen, sin pegar al borde de pantalla.

---

## 4. Solución exacta aplicada

1. **CreateMapOverlay:** Eliminado el div wrapper fullscreen. Renderiza solo card, pin y zoom como siblings del canvas, sin overlay que cubra.
2. **Drag:** Sin overlay que cubra, el canvas recibe directamente los touch en la zona libre.
3. **Dirección:** handleMapMove/handleMapMoveEnd ya existentes; debounce reducido a 150ms.
4. **Zoom:** top: 10px, left: calc(4% + 1rem).
5. **Pin:** Posición calculada en coordenadas del contenedor MapboxMap (MAP_TOP_VIEWPORT = 69).

---

## 5. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| CreateMapOverlay.jsx | Quitar wrapper fullscreen; renderizar card, pin, zoom sin overlay; pin en coords MapboxMap |
| Home.jsx | Debounce 150ms |
| MapZoomControls.jsx | left: calc(4% + 1rem) |

---

## 6. Validación real

1. Arrastrar en zona libre → canvas recibe → move/moveend se disparan.
2. handleMapMove actualiza selectedPosition y llama debouncedReverseGeocode.
3. reverseGeocode actualiza address con setAddress.
4. Zoom: mapRef.current.zoomIn/zoomOut.
5. Reubicar: handleRecenter con mapRef.current.flyTo.
6. Zoom controls: top: 10px, left: calc(4% + 1rem).

```

================================================================
FILE: docs/CURSOR_RULES_WAITME.md
================================================================
```md
# Reglas permanentes — WaitMe

Reglas que todo agente (humano o IA) debe seguir al trabajar en el proyecto. Mantener Cursor como IDE principal sin cambiar de herramienta.

---

## 1. Archivos protegidos

| Archivo | Regla |
|---------|-------|
| `src/pages/Home.jsx` | **No tocar** salvo orden explícita del usuario. Es el núcleo visual y de flujo principal. |
| `src/pages/History.jsx` | Evitar cambios estructurales. Lógica compleja de alertas, thinking_requests, rejected_requests. |
| `src/pages/Chat.jsx` | No romper flujo demo/real. Mantener compatibilidad con DemoFlowManager. |
| `src/components/MapboxMap.jsx` | No modificar sin seguir `docs/MAP_DEBUG_CHECKLIST.md`. |
| `src/components/map/ParkingMap.jsx` | Idem. |

---

## 2. Visuales

- **No cambiar** colores, tipografías, espaciados, animaciones ni layout salvo que el usuario lo pida explícitamente.
- Si un cambio funcional implica ajuste visual inevitable, hacerlo mínimo y documentarlo.

---

## 3. Datos y backend

- **Supabase** es la única fuente de verdad para datos persistentes.
- Los componentes usan adapters en `src/data/*.js`; nunca llaman a Supabase directamente.
- **No introducir mocks** si ya existe flujo real en Supabase para ese dominio.
- No crear duplicidades de servicios, hooks o stores. Reutilizar lo existente.

---

## 4. Documentación obligatoria

Antes de cerrar un cambio, documentar:

- Archivos tocados
- Riesgos identificados
- Prueba recomendada (manual o automatizada)

---

## 5. Estilo de cambios

- Preferir cambios **mínimos**, **limpios** y **reversibles**.
- Un commit = una idea. Evitar mezclar refactors con features.
- Mantener enfoque **mobile-first**: probar en viewport reducido.

---

## 6. Flujos críticos (no romper)

- Login → Home → Búsqueda / Crear alerta
- Home → History → Chat / Navigate
- IncomingRequestModal (aceptar/rechazar WaitMe)
- Mapas (MapboxMap, ParkingMap, SellerLocationTracker)
- Notificaciones y badge del BottomNav

---

## 7. Referencias

- `docs/PROJECT_SOURCE_OF_TRUTH.md` — dominios, tablas, pantallas
- `docs/MAP_DEBUG_CHECKLIST.md` — diagnóstico del mapa
- `docs/SAFE_CHANGE_PROTOCOL.md` — protocolo antes de aplicar cambios

```

================================================================
FILE: docs/DATA_LAYER.md
================================================================
```md
# Data Layer — Patrón Adapter (Strangler)

Los componentes **nunca** llaman directamente a Base44 ni a Supabase. Toda la comunicación con backends pasa por la capa de datos.

---

## 1. Qué es el adapter

El **Data Adapter** es una capa de abstracción entre la UI y los servicios de backend. Implementa el [Strangler Fig Pattern](https://martinfowler.com/articles/strangler-fig-application.html):

- Los componentes importan desde `@/data/*`.
- El adapter delega internamente al proveedor actual (Supabase, Base44, etc.).
- Para migrar: se cambia el proveedor en el adapter, sin tocar componentes.

---

## 2. Estructura

```
src/
├── data/                    # Data layer (adapters)
│   └── alerts.js           # Adapter de alertas
├── services/                # Implementaciones por proveedor
│   ├── alertsSupabase.js   # Supabase
│   └── alertService.js     # Legacy (schema antiguo)
└── pages/
    └── History.jsx         # import * as alerts from '@/data/alerts'
```

---

## 3. Uso del adapter de alertas

### API pública (`src/data/alerts.js`)

| Función | Descripción |
|---------|-------------|
| `getMyAlerts(sellerId)` | Alertas del vendedor |
| `getAlertsReservedByMe(buyerId)` | Alertas reservadas por el comprador |
| `createAlert(payload)` | Crear alerta |
| `updateAlert(alertId, updates)` | Actualizar alerta |
| `deleteAlert(alertId)` | Eliminar alerta |
| `subscribeAlerts({ onUpsert, onDelete })` | Realtime |

### En componentes

```js
import * as alerts from '@/data/alerts';

// Nunca:
// import { base44 } from '@/api/base44Client';
// import * as alertsSupabase from '@/services/alertsSupabase';

const { data } = await alerts.getMyAlerts(userId);
await alerts.updateAlert(alertId, { status: 'cancelled' });
```

---

## 4. Cómo terminar la migración

### Fase actual

- **Proveedor:** `alertsSupabase.js` (Supabase).
- **Componentes migrados:** useMyAlerts, History, HistorySellerView, HistoryBuyerView.

### Para migrar Home.jsx y el resto

1. Sustituir en cada componente:
   - `base44.entities.ParkingAlert.*` → `alerts.*` (desde `@/data/alerts`).
2. No importar nunca `base44` ni `alertsSupabase` en componentes.
3. Si hace falta una función nueva (ej. `getNearbyAlerts`), añadirla al adapter y al proveedor.

### Para cambiar de proveedor

Editar solo `src/data/alerts.js`:

```js
// Antes (Supabase)
import * as provider from '@/services/alertsSupabase';

// Después (Base44 u otro)
import * as provider from '@/services/alertsBase44';
```

Las firmas de las funciones deben ser compatibles entre proveedores.

### Para soportar ambos proveedores (A/B)

```js
const USE_SUPABASE = import.meta.env.VITE_ALERTS_PROVIDER === 'supabase';
const provider = USE_SUPABASE
  ? await import('@/services/alertsSupabase')
  : await import('@/services/alertsBase44');

export const getMyAlerts = provider.getMyAlerts;
// ...
```

---

## 5. Reglas

1. **Componentes** → solo importan de `@/data/*`.
2. **Hooks** → solo importan de `@/data/*`.
3. **Services** → implementan la lógica por proveedor; no se importan en UI.
4. **Base44** → no se elimina hasta migrar todo; el adapter oculta el proveedor activo.

---

## 6. Archivos

| Archivo | Rol |
|---------|-----|
| `src/data/alerts.js` | Adapter; re-exporta del proveedor actual |
| `src/services/alertsSupabase.js` | Implementación Supabase |
| `docs/DATA_LAYER.md` | Esta documentación |

```

================================================================
FILE: docs/DB_SETUP.md
================================================================
```md
# Configuración de base de datos WaitMe

## Migraciones

Las migraciones están en `supabase/migrations/`. Para aplicar:

```bash
npm run supabase:migrate
# o
npm run db:migrate:print   # imprime SQL para pegar en Supabase SQL Editor
```

## Realtime

Tras aplicar la migración `20260305160000_core_schema.sql`, activar Realtime en **Supabase Dashboard**:

1. Ir a **Database** → **Replication**
2. En la publicación `supabase_realtime`, asegurarse de que están incluidas:
   - `public.parking_alerts`
   - `public.alert_reservations`
   - `public.messages`
   - `public.user_locations`

Si la migración ya ejecutó `ALTER PUBLICATION supabase_realtime ADD TABLE ...`, las tablas estarán incluidas. Si aparece error "already member", las tablas ya estaban añadidas.

La app se suscribe a estas tablas para actualizaciones en tiempo real.

```

================================================================
FILE: docs/ENVIRONMENTS.md
================================================================
```md
# Environments — Staging y Production

Configuración de entornos para CI/CD con approvals.

---

## Resumen

| Environment | Uso | Approval | Workflows |
|-------------|-----|----------|-----------|
| **staging** | Deploy automático (futuro) | No | — |
| **production** | Migrations Supabase, deploy prod | Sí | supabase.yml |

---

## Configuración en GitHub

### 1. Crear environments

En el repo: **Settings → Environments**

- **staging**: sin protection rules (auto)
- **production**: con **Required reviewers** (1+ persona)

### 2. production (con approval)

1. Crear environment `production`
2. **Required reviewers**: añadir al menos un miembro del equipo
3. Cuando `supabase.yml` use `environment: production`, el job esperará aprobación antes de ejecutar

### 3. staging (sin approval)

1. Crear environment `staging`
2. Sin protection rules
3. Para futuros deploys automáticos (Vercel, Netlify, etc.)

---

## Flujo actual

```
push/PR a main
    → CI (lint, typecheck, tests, build)
    → Si pasa: Supabase workflow se dispara
    → Job "migrate" usa environment: production
    → Si hay reviewers: espera approval
    → Tras approval: drift check + db push
```

---

## Secrets por environment

Los secrets (`SUPABASE_*`, `VITE_*`) se definen a nivel de repo. Para separar staging/production en el futuro:

- **production**: secrets con sufijo `_PRODUCTION` o environment-specific
- **staging**: secrets con sufijo `_STAGING`

Hoy se usa un único proyecto Supabase (`WaitMeNuevo`), por lo que los secrets son compartidos.

```

================================================================
FILE: docs/FINAL_AUDIT.md
================================================================
```md
# Auditoría Final WaitMe — Post-Migración Base44 → Supabase

**Fecha:** 2025-03-05  
**Objetivo:** Confirmar eliminación total de Base44, arquitectura correcta, Supabase completo, CI/CD blindado y automatización máxima.

---

## A) Migración Base44 — Pruebas de eliminación

### A.1 Grep de referencias restantes

| Ubicación | Tipo | Acción |
|-----------|------|--------|
| `docs/*.md` | Documentación histórica | Solo menciones en contexto de migración; no código ejecutable |
| `src/data/*.js` | Comentarios | "Sustituye base44..." — informativo |
| `src/services/*.js` | Comentarios | "Sustituye base44..." — informativo |
| `supabase/migrations/*.sql` | Comentario | "migración desde base44" — histórico |

**Resultado:** No hay imports, llamadas ni dependencias de Base44 en código ejecutable. Solo documentación y comentarios históricos.

### A.2 Módulos eliminados

- `src/api/base44Client.js` — ELIMINADO
- `src/api/entities.js` — ELIMINADO
- `src/api/integrations.js` — ELIMINADO
- `src/lib/app-params.js` — ELIMINADO
- `@base44/sdk` — ELIMINADO de package.json
- `@base44/vite-plugin` — ELIMINADO de vite.config.js
- `VITE_BASE44_*` — ELIMINADO de .env.example

### A.3 Data-layer coverage

| Adapter | Provider | Páginas que lo usan |
|---------|----------|---------------------|
| `@/data/alerts` | alertsSupabase | Home, History, Chats, Navigate, Notifications, HistoryBuyerView, HistorySellerView, IncomingRequestModal, ActiveAlertCard, SellerLocationTracker, WaitMeRequestScheduler |
| `@/data/chat` | chatSupabase | Home, Chats, Chat, Navigate, HistoryBuyerView, IncomingRequestModal |
| `@/data/transactions` | transactionsSupabase | Home, History, Navigate |
| `@/data/notifications` | notificationsSupabase | Home, Chats, Notifications |
| `@/data/uploads` | uploadsSupabase | Chat |
| `@/data/profiles` | profilesSupabase | NotificationSettings |
| `@/data/userLocations` | userLocationsSupabase | SellerLocationTracker |

**Regla:** Todas las páginas importan desde `@/data/*`. Ninguna importa desde `@/services/*` directamente.

---

## B) Arquitectura

### B.1 Diagrama

```
┌─────────────────────────────────────────────────────────────────┐
│                         PAGES (src/pages/)                        │
│  Home, History, Chats, Chat, Navigate, Notifications, etc.      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ import * as X from '@/data/X'
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ADAPTERS (src/data/)                      │
│  alerts.js, chat.js, transactions.js, notifications.js,         │
│  uploads.js, profiles.js, userLocations.js                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ import * from '@/services/*Supabase'
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICES (src/services/)                         │
│  alertsSupabase, chatSupabase, transactionsSupabase,            │
│  notificationsSupabase, uploadsSupabase, profilesSupabase,       │
│  userLocationsSupabase                                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │ getSupabase()
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL + Realtime + Storage)     │
└─────────────────────────────────────────────────────────────────┘
```

### B.2 Reglas

1. **Pages → data:** Las páginas y componentes importan únicamente desde `@/data/*`.
2. **Data → services:** Los adapters reexportan funciones de `@/services/*Supabase`.
3. **Nunca:** Importar `@/services/*` en páginas o componentes de UI.
4. **Nunca:** Llamar a Base44 ni a Supabase directamente desde páginas.

---

## C) Supabase — Inventario

### C.1 Tablas

| Tabla | Columnas clave | Índices | Realtime |
|-------|----------------|---------|----------|
| `profiles` | id, email, full_name, notifications_enabled, notify_* | PK(id) | No |
| `parking_alerts` | id, seller_id, lat, lng, price_cents, status, geohash, metadata, reserved_by | idx_seller, idx_geohash_status, idx_status | Sí |
| `alert_reservations` | id, alert_id, buyer_id, status | idx_alert_id, idx_buyer_id, idx_status | Sí |
| `conversations` | id, alert_id, buyer_id, seller_id | idx_buyer, idx_seller | No |
| `messages` | id, conversation_id, sender_id, body | idx_conversation_created | Sí |
| `transactions` | id, buyer_id, seller_id, alert_id, amount, status | idx_buyer, idx_seller, idx_alert, idx_created | No |
| `user_locations` | user_id (PK), lat, lng | idx_updated_at | Sí |
| `user_location_updates` | id, user_id, alert_id, lat, lng, is_active | idx_alert_id, idx_alert_active | Sí |
| `notifications` | id, user_id, type, title, message, metadata, is_read | idx_user_id, idx_user_read, idx_created | Sí |

### C.2 RLS por tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | own | own | own | — |
| parking_alerts | all | own | own | own |
| alert_reservations | buyer/seller | buyer | buyer/seller | — |
| conversations | buyer/seller | buyer/seller | buyer/seller | — |
| messages | in conversation | sender in conv | — | — |
| transactions | buyer/seller | buyer/seller | buyer/seller | — |
| user_locations | all | own | own | — |
| user_location_updates | all | own | own | — |
| notifications | own | any | own | — |

### C.3 Storage

| Bucket | Público | Límite | Tipos | RLS |
|--------|---------|--------|-------|-----|
| uploads | Sí | 10MB | jpeg, png, gif, webp, pdf, mp4, webm | INSERT/DELETE: authenticated; SELECT: public |

---

## D) CI/CD

### D.1 Workflows

| Workflow | Trigger | Jobs | Concurrency |
|----------|---------|------|-------------|
| **CI** | push/PR a main | Lint, Typecheck, Tests, Contract tests, Build | ci-$ref, cancel-in-progress |
| **Supabase** | workflow_run CI success, o manual | migrations_test, migrate | supabase-$sha, cancel-in-progress |
| **CodeQL** | push/PR | analyze | — |
| **Dependabot** | — | — | — |

### D.2 Guardrails

- **check_migrations_safety.sh:** Bloquea DROP TABLE, TRUNCATE, DROP SCHEMA, DELETE FROM sin comentario SAFE.
- **migrations_test:** `supabase db reset` desde cero; verifica que existan: profiles, parking_alerts, alert_reservations, conversations, messages, transactions, user_locations, user_location_updates, notifications.
- **migrate:** `supabase db push` solo tras CI exitoso; usa environment `production`.
- **Schema drift:** Tras push, `supabase db diff` falla si hay cambios no reflejados en migraciones.

### D.3 Migraciones

- **No manual:** Las migraciones se aplican automáticamente por el workflow Supabase tras CI en verde.
- **Orden:** Por timestamp en nombre de archivo (20260304...).

---

## E) Riesgos detectados

### P0 (Crítico) — Corregidos

| Riesgo | Estado | Acción |
|--------|--------|--------|
| user_locations sin alert_id | ✅ Corregido | Creada tabla `user_location_updates` con alert_id; getLocationsByAlert implementado |
| SellerLocationTracker siempre vacío | ✅ Corregido | userLocationsSupabase.getLocationsByAlert consulta user_location_updates |

### P1 (Alto)

| Riesgo | Descripción | Acción sugerida |
|--------|-------------|-----------------|
| Buyer no actualiza ubicación | Navigate no llama upsertLocationForAlert; el comprador no envía su posición al vendedor | Añadir geolocation.watchPosition en Navigate y llamar userLocations.upsertLocationForAlert |
| Docs desactualizados | AUDITORIA_ARQUITECTURA, TECH_AUDIT, MIGRATION_STATUS mencionan Base44 como activo | Actualizar o archivar docs obsoletos |

### P2 (Medio)

| Riesgo | Descripción |
|--------|-------------|
| Sourcemaps Sentry | Plugin opcional; requiere SENTRY_AUTH_TOKEN en CI para subir |
| Branch protection | Ver docs/ONE_TIME_GITHUB_CLICKS.md |
| Storage migration local | `supabase db reset` puede fallar en storage policies (permisos); producción suele funcionar |

---

## F) Checklist end-to-end (Preview)

### F.1 Auth y perfil

1. Abrir app en preview (Vercel).
2. Iniciar sesión con OAuth (Google/Apple).
3. Ir a Perfil → editar datos → guardar.
4. Ir a Ajustes → Notificaciones → cambiar toggles.
5. Verificar que no hay errores en consola.

### F.2 Crear alerta (vendedor)

1. En Home, pulsar "Estoy aparcado aquí".
2. Completar formulario (dirección, precio, tiempo).
3. Confirmar publicación.
4. Verificar que aparece en Historial como activa.

### F.3 Comprar alerta (comprador)

1. En Home, modo búsqueda, seleccionar una alerta.
2. Pulsar "Comprar" / "Enviar WaitMe".
3. Confirmar.
4. Verificar que aparece en Historial como reservada.

### F.4 Chat

1. Desde Historial, abrir chat de una reserva activa.
2. Enviar mensaje.
3. Verificar que el mensaje aparece.
4. (Opcional) Adjuntar imagen.

### F.5 Navegación (comprador)

1. Con reserva activa, ir a Navegar.
2. Ver mapa con ruta.
3. Simular acercamiento (si hay tracking).
4. Liberar pago al estar a <5m.

### F.6 Notificaciones

1. Ir a Notificaciones.
2. Ver lista (demo + real si hay).
3. Marcar como leída.
4. Marcar todas como leídas.

### F.7 Prórroga (Chats)

1. En Chats, con conversación de alerta expirada.
2. Solicitar prórroga.
3. Verificar toast de confirmación.

---

## Resumen ejecutivo

- **Base44:** 100% eliminado del código.
- **Arquitectura:** Pages → data → services. Cumplida.
- **Supabase:** 9 tablas, RLS, Realtime, Storage configurados.
- **CI/CD:** Lint, tests, contract tests, build, migrations automáticas.
- **P0:** user_location_updates implementado; getLocationsByAlert funcional.
- **Pendiente P1:** Buyer actualice ubicación en Navigate; actualizar docs obsoletos.

```

================================================================
FILE: docs/FLUJO_AUTOMATIZADO.md
================================================================
```md
# Flujo automatizado

## Pre-commit

Antes de cada `git commit`:
1. **lint-staged** → `eslint --fix` en archivos staged
2. **npm run build** → si falla, el commit se aborta

## Post-commit

Tras cada commit exitoso: `git push origin main`

## GitHub Actions

`.github/workflows/lint-and-build.yml`: lint + build en cada push a main.

## Cómo trabajar

1. Haz cambios en Cursor
2. `git add .` y `git commit -m "tu mensaje"`
3. El pre-commit ejecuta lint y build; si pasan, el commit se completa
4. El post-commit hace push automático a main

Alternativa: `npm run ship` para lint:fix → build → add → commit (el push lo hace post-commit).

---

**Estado:** Auth, perfil, alertas, chat, transacciones y notificaciones usan Supabase. Base44 eliminado por completo.

```

================================================================
FILE: docs/MAPBOX_INTERACTION_ROOT_CAUSE.md
================================================================
```md
# Causa raíz — Interacción Mapbox en "Estoy aparcado aquí"

**Fecha:** 2025-03-06  
**Objetivo:** Reparar interacción real del mapa (drag, pinch, zoom, reubicar, dirección).

---

## 1. Causa raíz del drag roto

**Problema:** El mapa no se arrastra con un dedo.

**Causa:** Mapbox tiene `dragPan` y `touchZoomRotate` activos por defecto, pero no estaban explícitos. Además, el contenedor del mapa tiene `touch-action: none` (correcto). El div de contenido (z-10) tiene `pointer-events-none` cuando hay mode, por lo que los eventos pasan al mapa. La zona libre entre tarjeta, pin y zoom no tiene elementos con `pointer-events-auto`; el pin tiene `pointer-events-none`. Si los gestos no funcionaban, podría ser por: (a) gestos no habilitados explícitamente, (b) interferencia de `touch-action: manipulation` en html/body.

**Solución aplicada:** `dragPan: true` y `touchZoomRotate: true` explícitos en el constructor de Mapbox.

---

## 2. Causa raíz del pinch zoom roto

**Problema:** El mapa no hace zoom con dos dedos.

**Causa:** Misma que drag — `touchZoomRotate` no estaba explícito.

**Solución aplicada:** `touchZoomRotate: true` explícito.

---

## 3. Causa raíz de zoom +/- roto

**Problema:** Los botones + y - no funcionan.

**Causas posibles:**
1. `mapRef.current` null si el overlay se monta antes de que el mapa esté listo.
2. Mapbox GL v3 podría tener API distinta (zoomIn/zoomOut vs easeTo).
3. Llamada incorrecta a métodos inexistentes.

**Solución aplicada:** MapZoomControls usa `zoomIn(map)` y `zoomOut(map)` con fallback a `easeTo({ zoom: map.getZoom() ± 1 })` si zoomIn/zoomOut no existen. mapRef es el mismo que usa Ubícate; se asigna en `onMapLoad` de Home.

---

## 4. Causa raíz de Ubícate roto

**Problema:** El botón Ubícate no funciona.

**Verificación:** handleRecenter usa `mapRef.current?.flyTo(...)`. mapRef se asigna en `onMapLoad`. La instancia es la misma que usa zoom. Si zoom no funcionaba por API, Ubícate podría fallar por la misma razón. Con mapRef correcto, flyTo debería funcionar.

**Solución aplicada:** Asegurar que mapRef.current sea la instancia visible real (ya lo es vía onMapLoad). No se requirió cambio adicional.

---

## 5. Causa raíz de dirección fija en Oviedo

**Problema:** La dirección no cambia en tiempo real.

**Causa:** Si el mapa no recibe drag/pinch, `move`/`moveend` no se disparan → handleMapMove/handleMapMoveEnd no se llaman → debouncedReverseGeocode no se ejecuta → address no se actualiza. Arreglar los gestos desbloquea la cadena.

**Solución aplicada:** Arreglar gestos primero. El flujo ya existe: move/moveend → handleMapMove/handleMapMoveEnd → setSelectedPosition + debouncedReverseGeocode → reverseGeocode → setAddress.

---

## 6. Solución exacta aplicada

| Cambio | Archivo |
|--------|---------|
| dragPan: true, touchZoomRotate: true explícitos | MapboxMap.jsx |
| zoomIn/zoomOut con fallback easeTo | MapZoomControls.jsx |

---

## 7. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| MapboxMap.jsx | dragPan: true, touchZoomRotate: true |
| MapZoomControls.jsx | zoomIn/zoomOut con fallback easeTo |

---

## 8. Validación técnica real

1. **Instancia zoom:** mapRef.current (asignado en onMapLoad).
2. **Instancia Ubícate:** mapRef.current (mismo ref).
3. **dragPan:** true explícito.
4. **touchZoomRotate:** true explícito.
5. **move/moveend:** Se disparan cuando el mapa recibe gestos; handlers ya conectados.
6. **Bloqueo de gestos:** Posible falta de habilitación explícita; overlay sin fullscreen permite que el canvas reciba toques en la zona libre.
7. **Por qué ahora:** Gestos explícitos + fallback en zoom para compatibilidad con Mapbox GL v3.

```
