-- RLS audit test cases for BookingGG Supabase schema
-- Run in Supabase SQL editor after schema.sql.
-- The script runs inside a transaction and rolls back.

begin;

create or replace function public.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if not condition then
    raise exception 'RLS audit failed: %', message;
  end if;
end;
$$;

-- test identities
select
  gen_random_uuid() as user_a_id,
  gen_random_uuid() as user_b_id,
  gen_random_uuid() as admin_id,
  gen_random_uuid() as service_id,
  gen_random_uuid() as booking_a_id,
  gen_random_uuid() as booking_b_id,
  gen_random_uuid() as settings_id
into temporary table _ids;

-- seed minimum auth + domain data (postgres role bypasses RLS)
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select user_a_id, 'authenticated', 'authenticated', 'user-a@audit.local', crypt('password', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now() from _ids
union all
select user_b_id, 'authenticated', 'authenticated', 'user-b@audit.local', crypt('password', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now() from _ids
union all
select admin_id, 'authenticated', 'authenticated', 'admin@audit.local', crypt('password', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now() from _ids;

insert into public.profiles (id, email, full_name, role)
select user_a_id, 'user-a@audit.local', 'User A', 'user' from _ids
union all
select user_b_id, 'user-b@audit.local', 'User B', 'user' from _ids
union all
select admin_id, 'admin@audit.local', 'Admin', 'admin' from _ids;

insert into public.services (id, title, description, price, duration_min, is_active)
select service_id, 'Audit Service', 'RLS audit service', 39.00, 60, true from _ids;

insert into public.business_settings (id, shop_name, opening_hours_json, currency)
select settings_id, 'Audit Shop', '{"mon":["09:00","18:00"]}'::jsonb, 'EUR' from _ids;

insert into public.bookings (id, user_id, service_id, start_time, end_time, status, notes)
select booking_a_id, user_a_id, service_id, now(), now() + interval '1 hour', 'pending', 'owned by A' from _ids
union all
select booking_b_id, user_b_id, service_id, now() + interval '2 hour', now() + interval '3 hour', 'pending', 'owned by B' from _ids;

-- USER A context
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select user_a_id::text from _ids), true);

select public.assert_true(
  (select count(*) from public.profiles where id = (select user_a_id from _ids)) = 1,
  'User A should read own profile'
);

select public.assert_true(
  (select count(*) from public.profiles where id = (select user_b_id from _ids)) = 0,
  'User A should not read user B profile'
);

select public.assert_true(
  (select count(*) from public.bookings where user_id = (select user_a_id from _ids)) = 1,
  'User A should read own booking'
);

select public.assert_true(
  (select count(*) from public.bookings where user_id = (select user_b_id from _ids)) = 0,
  'User A should not read user B booking'
);

select public.assert_true(
  (select count(*) from public.services) = 1,
  'Public/authenticated users should read active services'
);

select public.assert_true(
  (select count(*) from public.business_settings) = 1,
  'Public/authenticated users should read business settings'
);

update public.services
set price = 41
where id = (select service_id from _ids);

select public.assert_true(
  (select price from public.services where id = (select service_id from _ids)) = 39,
  'Non-admin should not update service price'
);

reset role;

-- ADMIN context
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select admin_id::text from _ids), true);

select public.assert_true(
  (select count(*) from public.bookings) = 2,
  'Admin should read all bookings'
);

update public.services
set price = 42
where id = (select service_id from _ids);

select public.assert_true(
  (select price from public.services where id = (select service_id from _ids)) = 42,
  'Admin should update service price'
);

update public.bookings
set status = 'confirmed'
where id = (select booking_b_id from _ids);

select public.assert_true(
  (select status from public.bookings where id = (select booking_b_id from _ids)) = 'confirmed',
  'Admin should update any booking'
);

reset role;

rollback;
