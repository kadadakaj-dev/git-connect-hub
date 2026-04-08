
-- Migration: Fix permissions for blocked_slots
-- Date: 2026-04-08

-- Grant full access to authenticated users (admins) for blocked_slots
GRANT ALL ON public.blocked_slots TO authenticated;

-- Ensure RLS is still active but correctly configured
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON public.blocked_slots;
CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure public can still view for availability checks
DROP POLICY IF EXISTS "Public can view blocked slots" ON public.blocked_slots;
CREATE POLICY "Public can view blocked slots" ON public.blocked_slots
FOR SELECT TO public
USING (true);
