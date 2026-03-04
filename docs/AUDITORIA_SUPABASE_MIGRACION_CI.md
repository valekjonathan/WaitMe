# Auditoría Supabase + CI/CD — WaitMe

**Fecha:** 2025-03-04  
**Objetivo:** Preparar migración completa a Supabase y dejar CI/CD de migrations perfecto.

---

## 1. REVISIÓN CARPETA /supabase

### Estructura actual

```
supabase/
├── config.toml          # Config local (project_id: WaitMeNuevo)
├── .gitignore           # .branches, .temp, .env*
├── README.md            # Instrucciones
├── seed.sql             # Vacío (solo comentario)
├── migrations/
│   └── 20260304134200_create_profiles.sql
└── functions/
    └── .gitkeep         # Carpeta vacía
```

### config.toml

- `project_id = "WaitMeNuevo"` — identificador local, no el ref de Supabase Cloud
- `db.migrations.enabled = true`
- `db.seed.sql_paths = ["./seed.sql"]`
- `schema_paths = []` — correcto, usa migrations/

### seed.sql

- Contenido: solo comentario. Sin datos de prueba.

### functions/

- Carpeta vacía con .gitkeep. Sin Edge Functions.

---

## 2. MIGRACIONES EXISTENTES

| Archivo | Crea/Cambia |
|---------|-------------|
| `20260304134200_create_profiles.sql` | Crea tabla `public.profiles` con columnas: id, email, full_name, avatar_url, display_name, brand, model, color, vehicle_type, plate, phone, allow_phone_calls, notifications_enabled, email_notifications, created_at, updated_at. Habilita RLS. Políticas: select/update/insert con `auth.uid() = id`. |

---

## 3. WORKFLOWS GITHUB ACTIONS

### Estado actual

| Archivo | Trigger | Método CLI | Secrets |
|---------|---------|------------|---------|
| `main.yml` | push a main (sin paths) | `npm install -g supabase` ❌ deprecado | SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN. **Bug:** db push usa SUPABASE_ACCESS_TOKEN en vez de SUPABASE_DB_PASSWORD |
| `supabase-migrations.yml` | push a main si `supabase/migrations/**` | supabase/setup-cli@v1 ✅ | SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD ✅ |

### Problemas detectados

1. **Workflow duplicado:** main.yml y supabase-migrations.yml hacen lo mismo.
2. **main.yml usa método deprecado:** `npm install -g supabase` falla con "Installing Supabase CLI as a global module is not supported."
3. **main.yml bug:** `supabase db push` necesita `SUPABASE_DB_PASSWORD`, no `SUPABASE_ACCESS_TOKEN`.
4. **main.yml trigger amplio:** se ejecuta en cualquier push a main, no solo en cambios de migrations.

### Acción

- **Eliminar** `.github/workflows/main.yml`
- **Mantener** `.github/workflows/supabase-migrations.yml` como único workflow.

---

## 4. SECRETS ESPERADOS

| Secret | Uso |
|--------|-----|
| `SUPABASE_ACCESS_TOKEN` | Autenticación con Supabase API (link, etc.) |
| `SUPABASE_PROJECT_REF` | ID del proyecto (ej. `abcdefghij`) |
| `SUPABASE_DB_PASSWORD` | Contraseña de Postgres para `db push` |

**Verificar en repo:** Settings → Secrets and variables → Actions. Los tres deben existir.

---

## 5. CHECKLIST CI/CD

- [x] Workflow único: supabase-migrations.yml
- [x] Usa supabase/setup-cli@v1
- [x] Trigger: push a main solo si `supabase/migrations/**`
- [x] workflow_dispatch para ejecución manual
- [x] supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
- [x] supabase db push con SUPABASE_DB_PASSWORD
- [x] SUPABASE_ACCESS_TOKEN en paso de link
- [ ] Secrets configurados en el repo (manual)

---

## 6. PLAN DE MIGRACIÓN A SUPABASE

### Tablas mínimas

| Tabla | Descripción |
|-------|-------------|
| `profiles` | ✅ Ya existe (migración actual) |
| `parking_alerts` | Alertas de aparcamiento (vendedor, comprador, estado) |
| `reservations` | Opcional: se puede modelar con `reserved_by_id` en parking_alerts |
| `chat_threads` | Hilos de conversación (1 por alerta + par seller/buyer) |
| `chat_messages` | Mensajes dentro de un thread |
| `transactions` | Pagos entre buyer y seller |

### Esquema propuesto (migraciones futuras)

#### 6.1 parking_alerts

```sql
create table public.parking_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
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
  color text default 'gris',
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

alter table public.parking_alerts enable row level security;

create policy "Users view own or reserved" on public.parking_alerts for select
  using (auth.uid() = user_id or auth.uid() = reserved_by_id);
create policy "Authenticated view active" on public.parking_alerts for select
  using (auth.role() = 'authenticated' and status = 'active');
create policy "Users create own" on public.parking_alerts for insert
  with check (auth.uid() = user_id);
create policy "Users update own or reserved" on public.parking_alerts for update
  using (auth.uid() = user_id or auth.uid() = reserved_by_id);
create policy "Users delete own" on public.parking_alerts for delete
  using (auth.uid() = user_id);
```

#### 6.2 chat_threads (conversations)

```sql
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.parking_alerts(id) on delete cascade not null,
  participant1_id uuid references auth.users(id) on delete cascade,
  participant2_id uuid references auth.users(id) on delete cascade,
  last_message_text text,
  last_message_at timestamptz,
  unread_count_p1 integer default 0,
  unread_count_p2 integer default 0,
  created_at timestamptz default now()
);

create index idx_chat_threads_alert_id on public.chat_threads(alert_id);
create index idx_chat_threads_p1 on public.chat_threads(participant1_id);
create index idx_chat_threads_p2 on public.chat_threads(participant2_id);

alter table public.chat_threads enable row level security;

create policy "Participants view" on public.chat_threads for select
  using (auth.uid() = participant1_id or auth.uid() = participant2_id);
create policy "Participants insert" on public.chat_threads for insert
  with check (auth.uid() = participant1_id or auth.uid() = participant2_id);
create policy "Participants update" on public.chat_threads for update
  using (auth.uid() = participant1_id or auth.uid() = participant2_id);
```

#### 6.3 chat_messages

```sql
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create index idx_chat_messages_thread_id on public.chat_messages(thread_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

alter table public.chat_messages enable row level security;

create policy "Participants view" on public.chat_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Sender insert" on public.chat_messages for insert
  with check (auth.uid() = sender_id);
create policy "Receiver update read" on public.chat_messages for update
  using (auth.uid() = receiver_id);
```

#### 6.4 transactions

```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.parking_alerts(id) on delete set null,
  buyer_id uuid references auth.users(id) on delete cascade not null,
  seller_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_transactions_buyer on public.transactions(buyer_id);
create index idx_transactions_seller on public.transactions(seller_id);
create index idx_transactions_alert on public.transactions(alert_id);

alter table public.transactions enable row level security;

create policy "Parties view" on public.transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Parties insert" on public.transactions for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);
```

### Índices recomendados

| Tabla | Índice | Propósito |
|-------|--------|-----------|
| parking_alerts | user_id, status, created_date | Listar alertas del usuario |
| parking_alerts | (status, created_date) | Búsqueda de activas ordenadas |
| chat_threads | alert_id, participant1_id, participant2_id | Mis conversaciones |
| chat_messages | thread_id, created_at | Mensajes de un thread |
| transactions | buyer_id, seller_id, alert_id | Balance por usuario |

### Opcional: PostGIS para geolocalización

```sql
create extension if not exists postgis;
alter table public.parking_alerts add column location geography(Point, 4326);
create index idx_parking_alerts_location on public.parking_alerts using gist(location);
```

---

## 7. RESUMEN DE CAMBIOS APLICADOS

1. **Eliminado** `.github/workflows/main.yml` (workflow duplicado y deprecado)
2. **Mantenido** `.github/workflows/supabase-migrations.yml` como único workflow
3. **Verificado** que el workflow usa setup-cli, paths correctos, trigger y secrets adecuados

---

## 8. PRÓXIMOS PASOS

1. Configurar los 3 secrets en GitHub si no están.
2. Crear migraciones para parking_alerts, chat_threads, chat_messages, transactions cuando se migre de base44.
3. Añadir trigger `updated_at` en profiles (migración separada).
4. Crear bucket `avatars` y políticas Storage en Supabase Dashboard o migración.
