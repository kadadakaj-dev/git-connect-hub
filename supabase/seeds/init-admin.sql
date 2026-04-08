-- =====================================================================================
-- FYZIOAFIT - SINGLE ADMIN BOOTSTRAP SCRIPT
-- =====================================================================================
-- IMPORTANT: Do not run this script on the client side.
-- This script safely inserts the single designated Administrator into the Supabase auth schema.
-- Run this directly in your Supabase SQL Editor once.

-- 1. Create the user in the auth.users table 
-- Note: 'Booking1@@@' is the required starting password.
-- The password is automatically hashed by pgcrypto's crypt function.

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'booking@fyzioafit.sk',
  crypt('Booking1@@@', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 2. If you are using a user_roles schema for granular access guard (optional fallback check):
-- Ensure the table exists before attempting to insert.
/*
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'client', 'employee')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Insert explicit admin role mapping
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'booking@fyzioafit.sk'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
*/

-- =====================================================================================
-- VERIFICATION:
-- 1. Try to login at /auth using booking@fyzioafit.sk / Booking1@@@
-- 2. The client portal will load, then manually navigate to /admin.
-- 3. You should see the Admin Dashboard.
-- 4. From there, you can change your password securely using the Supabase "Reset Password" flow if configured.
-- =====================================================================================

