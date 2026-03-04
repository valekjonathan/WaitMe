-- Ejecutar en Supabase SQL Editor si la tabla profiles no existe
-- y crear bucket 'avatars' en Storage con políticas públicas de lectura

-- Tabla profiles (compatible con auth.users)
-- Campos obligatorios: full_name, phone, brand, model, color, vehicle_type, plate
-- Campo opcional: avatar_url
create table if not exists public.profiles (
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

-- RLS: usuarios solo pueden leer/actualizar su propio perfil
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
