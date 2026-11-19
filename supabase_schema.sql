-- =====================================================================
-- ESQUEMA SQL PARA SUPABASE — PROYECTO DETALLES QR
-- Instrucciones:
-- 1. En tu panel de Supabase ve a "SQL Editor" -> "New query"
-- 2. Pega todo este código y haz clic en "Run"
-- =====================================================================

-- 1. Crear la tabla principal de detalles personalizados
create table if not exists public.gifts (
  slug text primary key,
  theme text not null default 'flores',
  sender_name text not null,
  recipient_name text not null,
  message text not null,
  image_url text,
  start_date text not null,
  song_title text,
  music_url text,
  music_start_seconds integer not null default 0,
  music_clip_duration integer not null default 30,
  location_name text not null default 'Lima, Perú',
  buyer_phone text not null default '',
  is_paid boolean not null default true,
  created_at timestamptz not null default now()
);

-- Si ya habías creado la tabla antes, estas líneas agregan las columnas nuevas sin borrar tus datos:
alter table public.gifts add column if not exists location_name text not null default 'Lima, Perú';
alter table public.gifts add column if not exists buyer_phone text not null default '';

-- 2. Activar Row Level Security (RLS) y permitir lectura/creación pública
alter table public.gifts enable row level security;

drop policy if exists "Lectura publica de detalles" on public.gifts;
create policy "Lectura publica de detalles"
  on public.gifts
  for select
  using (true);

drop policy if exists "Creacion publica de detalles" on public.gifts;
create policy "Creacion publica de detalles"
  on public.gifts
  for insert
  with check (true);

drop policy if exists "Actualizacion publica de detalles" on public.gifts;
create policy "Actualizacion publica de detalles"
  on public.gifts
  for update
  using (true);

-- 3. Crear el bucket público para almacenar las fotografías ("gift-photos")
-- Nota: Como el bucket es public = true, las URLs directas de las fotos ya cargan
-- sin necesidad de una política SELECT abierta (así nadie puede listar toda la carpeta).
insert into storage.buckets (id, name, public)
values ('gift-photos', 'gift-photos', true)
on conflict (id) do nothing;

drop policy if exists "Lectura publica de fotos" on storage.objects;

drop policy if exists "Subida publica de fotos" on storage.objects;
create policy "Subida publica de fotos"
  on storage.objects
  for insert
  with check (bucket_id = 'gift-photos');
