
-- Migration: Final permission fix for blocked_slots
-- Date: 2026-04-08

-- Explicitly grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant ALL permissions on the table to all relevant roles
GRANT ALL ON TABLE public.blocked_slots TO anon, authenticated, service_role, postgres;

-- Re-apply policies
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON public.blocked_slots;
CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view blocked slots" ON public.blocked_slots;
CREATE POLICY "Public can view blocked slots" ON public.blocked_slots
FOR SELECT TO public
USING (true);

-- Add a policy for anon INSERT just for debugging (REMOVE LATER if needed)
-- Actually, let's keep it restricted to authenticated but ensure the grant worked
