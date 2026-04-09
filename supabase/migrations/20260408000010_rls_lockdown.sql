-- Migration: RLS / Grants Lockdown
-- Date: 2026-04-08
-- Description: Revokes direct mutation permissions on bookings table to ensure RPC enforcement.

-- 1. Ensure RLS is active
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing mutation policies for non-admins
-- We want to make sure no one can bypass our create_secure_booking logic
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;

-- 3. Define NEW strict policies

-- A. SELECT: Allow users to read (needed for availability checks and portal)
-- Note: create_secure_booking is SECURITY DEFINER, so it bypasses this anyway.
DROP POLICY IF EXISTS "Enable read access for all" ON public.bookings;
CREATE POLICY "Enable read access for all"
ON public.bookings FOR SELECT
TO public
USING (true);

-- B. ADMIN: Full access for administrators only
DROP POLICY IF EXISTS "Admins have full access" ON public.bookings;
CREATE POLICY "Admins have full access"
ON public.bookings FOR ALL
TO authenticated
USING (
  (SELECT (raw_app_meta_data->>'role')::text FROM auth.users WHERE id = auth.uid()) = 'admin'
  OR has_role(auth.uid(), 'admin'::text)
);

-- 4. GRANT Lockdown
-- Revoke direct mutation rights from standard roles
REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon, authenticated;

-- Ensure SELECT is still allowed for basic functionality
GRANT SELECT ON public.bookings TO anon, authenticated;

-- Ensure service_role and postgres stay as super-users for Edge Functions/Automation
GRANT ALL ON public.bookings TO postgres, service_role;
