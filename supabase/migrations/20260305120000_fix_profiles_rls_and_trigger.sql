-- Fix profiles: trigger para nuevos usuarios + políticas RLS explícitas
-- Resuelve "Error al guardar" al actualizar perfil

-- 1. Asegurar que la tabla profiles existe con estructura correcta
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

-- 2. RLS activado
alter table public.profiles enable row level security;

-- 3. Eliminar políticas existentes para recrearlas (evita conflictos)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- 4. Políticas RLS explícitas
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 6. Backfill: crear perfiles para usuarios existentes sin perfil
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
