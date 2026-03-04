-- Tabla parking_alerts para migración desde base44
create table if not exists public.parking_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  price numeric not null,
  vehicle_type text default 'car',
  status text default 'active',
  reserved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- Índices para consultas frecuentes
create index if not exists idx_parking_alerts_status on public.parking_alerts(status);
create index if not exists idx_parking_alerts_user_id on public.parking_alerts(user_id);
create index if not exists idx_parking_alerts_expires_at on public.parking_alerts(expires_at);

-- RLS
alter table public.parking_alerts enable row level security;

-- Usuario puede insertar sus alertas
create policy "Users can insert own alerts"
  on public.parking_alerts for insert
  with check (auth.uid() = user_id);

-- Usuario puede ver alertas activas (mapa) y sus propias alertas
create policy "Users can view active and own alerts"
  on public.parking_alerts for select
  using (
    status = 'active'
    or auth.uid() = user_id
    or auth.uid() = reserved_by
  );

-- Usuario puede actualizar sus alertas (owner) o reservar alertas activas (buyer)
create policy "Users can update own or reserve active alerts"
  on public.parking_alerts for update
  using (
    auth.uid() = user_id
    or (status = 'active' and auth.uid() is not null)
  );
