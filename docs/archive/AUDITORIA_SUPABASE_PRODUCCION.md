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
