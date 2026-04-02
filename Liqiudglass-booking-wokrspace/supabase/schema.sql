-- UBM Booking: Supabase schema + RLS + automation + realtime

create extension if not exists "pgcrypto";

create type public.app_role as enum ('user', 'admin');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

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
  user_id uuid not null references auth.users(id) on delete cascade,
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

create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_start_time on public.bookings(start_time);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_services_active on public.services(is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger trg_business_settings_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.business_settings enable row level security;

-- profiles: user owns own profile, admin sees/edits all
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
with check (id = auth.uid() or public.is_admin());

-- services: public read active, admin full manage
create policy "services_public_read_active"
on public.services
for select
using (is_active = true or public.is_admin());

create policy "services_admin_insert"
on public.services
for insert
with check (public.is_admin());

create policy "services_admin_update"
on public.services
for update
using (public.is_admin())
with check (public.is_admin());

create policy "services_admin_delete"
on public.services
for delete
using (public.is_admin());

-- bookings: user only own rows, admin all
create policy "bookings_select_own_or_admin"
on public.bookings
for select
using (user_id = auth.uid() or public.is_admin());

create policy "bookings_insert_own_or_admin"
on public.bookings
for insert
with check (user_id = auth.uid() or public.is_admin());

create policy "bookings_update_own_or_admin"
on public.bookings
for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "bookings_delete_own_or_admin"
on public.bookings
for delete
using (user_id = auth.uid() or public.is_admin());

-- business settings: public read, admin write
create policy "business_settings_public_read"
on public.business_settings
for select
using (true);

create policy "business_settings_admin_insert"
on public.business_settings
for insert
with check (public.is_admin());

create policy "business_settings_admin_update"
on public.business_settings
for update
using (public.is_admin())
with check (public.is_admin());

create policy "business_settings_admin_delete"
on public.business_settings
for delete
using (public.is_admin());

-- signup automation trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- realtime enablement for bookings
alter publication supabase_realtime add table public.bookings;
