-- =====================================================================
-- SUPABASE SETUP — Spusti toto v Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Paste → Run
--
-- Poradie: 1) schema.sql  2) fix_schema.sql  3) seed_services.sql
-- Bezpečné spustiť viackrát (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- KROK 1: Základná schéma (profiles, services, bookings, business_settings)
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'admin');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id bigint primary key generated always as identity,
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  duration_min integer not null check (duration_min > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- nullable (hostia bez účtu)
  service_id bigint not null references public.services(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_valid check (end_time > start_time)
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  opening_hours_json jsonb not null default '{}'::jsonb,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexy
create index if not exists idx_bookings_user_id    on public.bookings(user_id);
create index if not exists idx_bookings_start_time on public.bookings(start_time);
create index if not exists idx_bookings_status     on public.bookings(status);
create index if not exists idx_services_active     on public.services(is_active);

-- Trigger funkcia pre updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create or replace trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create or replace trigger trg_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- Admin helper funkcia
create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- RLS
alter table public.profiles         enable row level security;
alter table public.services         enable row level security;
alter table public.bookings         enable row level security;
alter table public.business_settings enable row level security;

-- profiles policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'profiles_select_own_or_admin' and tablename = 'profiles') then
    create policy "profiles_select_own_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'profiles_update_own_or_admin' and tablename = 'profiles') then
    create policy "profiles_update_own_or_admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'profiles_insert_self_or_admin' and tablename = 'profiles') then
    create policy "profiles_insert_self_or_admin" on public.profiles for insert with check (id = auth.uid() or public.is_admin());
  end if;
end $$;

-- services policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'services_public_read_active' and tablename = 'services') then
    create policy "services_public_read_active" on public.services for select using (is_active = true or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'services_admin_insert' and tablename = 'services') then
    create policy "services_admin_insert" on public.services for insert with check (public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'services_admin_update' and tablename = 'services') then
    create policy "services_admin_update" on public.services for update using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'services_admin_delete' and tablename = 'services') then
    create policy "services_admin_delete" on public.services for delete using (public.is_admin());
  end if;
end $$;

-- bookings policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'bookings_select_own_or_admin' and tablename = 'bookings') then
    create policy "bookings_select_own_or_admin" on public.bookings for select using (user_id = auth.uid() or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'bookings_insert_own_or_admin' and tablename = 'bookings') then
    create policy "bookings_insert_own_or_admin" on public.bookings for insert with check (user_id = auth.uid() or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'bookings_update_own_or_admin' and tablename = 'bookings') then
    create policy "bookings_update_own_or_admin" on public.bookings for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'bookings_delete_own_or_admin' and tablename = 'bookings') then
    create policy "bookings_delete_own_or_admin" on public.bookings for delete using (user_id = auth.uid() or public.is_admin());
  end if;
end $$;

-- business_settings policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'business_settings_public_read' and tablename = 'business_settings') then
    create policy "business_settings_public_read" on public.business_settings for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'business_settings_admin_insert' and tablename = 'business_settings') then
    create policy "business_settings_admin_insert" on public.business_settings for insert with check (public.is_admin());
  end if;
end $$;

-- Auto-create profile pri registrácii
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime pre bookings
alter publication supabase_realtime add table public.bookings;

-- ─────────────────────────────────────────────────────────────────────
-- KROK 2: Fix schema — gender/category, guest booking, anonymous RLS
-- ─────────────────────────────────────────────────────────────────────

alter table public.services
  add column if not exists gender   text not null default 'unisex';
alter table public.services
  add column if not exists category text not null default 'Všeobecné';

alter table public.bookings
  add column if not exists customer_name  text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text;

-- user_id nullable — hostia môžu rezervovať bez účtu
alter table public.bookings alter column user_id drop not null;

-- Anonymné rezervácie (booking widget)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'bookings_anon_insert' and tablename = 'bookings') then
    create policy "bookings_anon_insert" on public.bookings for insert with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'bookings_anon_select' and tablename = 'bookings') then
    create policy "bookings_anon_select" on public.bookings for select using (true);
  end if;
end $$;

create index if not exists idx_services_gender   on public.services(gender);
create index if not exists idx_services_category on public.services(category);

-- ─────────────────────────────────────────────────────────────────────
-- KROK 3: Seed — Salon services (PapiHair)
-- ─────────────────────────────────────────────────────────────────────

truncate public.services restart identity cascade;

insert into public.services (title, gender, category, price, duration_min, is_active) values
-- DÁMSKY: Strih & Styling
('Dámsky strih',             'damsky', 'Strih & Styling',  30.00,  45, true),
('Fúkaná dlhé vlasy',        'damsky', 'Strih & Styling',  30.00,  45, true),
('Fúkaná polodlhé vlasy',    'damsky', 'Strih & Styling',  20.00,  30, true),
('Finálny styling',          'damsky', 'Strih & Styling',  20.00,  30, true),
-- DÁMSKY: Farbenie
('Farbenie odrastov so strihom',  'damsky', 'Farbenie',  60.00,  90, true),
('Farbenie odrastov',             'damsky', 'Farbenie',  45.00,  60, true),
('Kompletné farbenie',            'damsky', 'Farbenie',  70.00,  90, true),
('Kompletné farbenie so strihom', 'damsky', 'Farbenie',  90.00, 120, true),
-- DÁMSKY: Balayage & Melír
('Balayage komplet', 'damsky', 'Balayage & Melír', 150.00, 180, true),
('Balayage dorábka', 'damsky', 'Balayage & Melír', 120.00, 150, true),
('Melír dorábka',    'damsky', 'Balayage & Melír', 120.00, 150, true),
('Melír komplet',    'damsky', 'Balayage & Melír', 150.00, 180, true),
-- DÁMSKY: Odfarbovanie & Regenerácia
('Gumovanie alebo čistenie farby', 'damsky', 'Odfarbovanie & Regenerácia', 100.00, 120, true),
('Sťahovanie farby',               'damsky', 'Odfarbovanie & Regenerácia', 160.00, 150, true),
('Methamorphyc – rýchla kúra',     'damsky', 'Odfarbovanie & Regenerácia',  35.00,  30, true),
('Methamorphyc – exkluzívna kúra', 'damsky', 'Odfarbovanie & Regenerácia',  50.00,  45, true),
('Brazílsky keratín',              'damsky', 'Odfarbovanie & Regenerácia', 130.00, 120, true),
-- DÁMSKY: Predlžovanie & Účesy
('Aplikácia Tape-in',  'damsky', 'Predlžovanie & Účesy',  40.00,  60, true),
('Prepojenie Tape-in', 'damsky', 'Predlžovanie & Účesy', 120.00,  90, true),
('Zapletané vrkôčiky', 'damsky', 'Predlžovanie & Účesy',  30.00,  30, true),
('Spoločenský účes',   'damsky', 'Predlžovanie & Účesy',  40.00,  45, true),
-- PÁNSKY: Vlasy
('Strih Junior (do 15 r.)', 'pansky', 'Vlasy', 15.00, 20, true),
('Pánsky strih',            'pansky', 'Vlasy', 19.00, 30, true),
-- PÁNSKY: Brada & Kombinácie
('Úprava brady',             'pansky', 'Brada & Kombinácie', 12.00, 15, true),
('Kombinácia vlasy a brada', 'pansky', 'Brada & Kombinácie', 27.00, 40, true),
('Pánsky špeciál',           'pansky', 'Brada & Kombinácie', 50.00, 60, true),
-- PÁNSKY: Farbenie
('Trvalá',             'pansky', 'Farbenie', 40.00, 60, true),
('Zosvetlenie vlasov', 'pansky', 'Farbenie', 40.00, 60, true),
('Farbenie brady',     'pansky', 'Farbenie', 10.00, 20, true),
('Tónovanie sedín',    'pansky', 'Farbenie', 10.00, 20, true),
-- PÁNSKY: Doplnkové Služby
('Depilácia nosa aj uší',   'pansky', 'Doplnkové Služby',  5.00, 10, true),
('Ušné sviečky',            'pansky', 'Doplnkové Služby', 10.00, 15, true),
('Čierna zlupovacia maska', 'pansky', 'Doplnkové Služby', 12.00, 20, true);

-- ─────────────────────────────────────────────────────────────────────
-- KROK 4: Základné business settings (PapiHair)
-- ─────────────────────────────────────────────────────────────────────

insert into public.business_settings (shop_name, currency, opening_hours_json)
values (
  'PapiHair Design',
  'EUR',
  '{
    "monday":    {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday":   {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday":  {"open": "09:00", "close": "18:00", "closed": false},
    "friday":    {"open": "09:00", "close": "17:00", "closed": false},
    "saturday":  {"open": "09:00", "close": "14:00", "closed": false},
    "sunday":    {"open": null,    "close": null,    "closed": true}
  }'::jsonb
)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- HOTOVO! Overiť:
-- select count(*) from public.services;      -- mal by vrátiť 34
-- select count(*) from public.business_settings;  -- mal by vrátiť 1
-- ─────────────────────────────────────────────────────────────────────
