
-- Migration: Consolidated security fix for blocked_slots
-- Date: 2026-04-08
-- Root Cause: PostgreSQL code 42501 (insufficient_privilege) caused by missing table-level GRANTs for the 'authenticated' role.

-- 1. Ensure RLS is active (reversing diagnostic 'nuclear' step)
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- 2. Audit and fix Grants (The critical fix)
-- Postgrest needs explicit INSERT/UPDATE/DELETE grants for the role performing the action.
GRANT ALL ON TABLE public.blocked_slots TO authenticated, service_role;
GRANT SELECT ON TABLE public.blocked_slots TO anon;

-- 3. Implement secure RLS policies
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON public.blocked_slots;
CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots
FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') 
    OR auth.jwt() ->> 'email' = 'booking@fyzioafit.sk'
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR auth.jwt() ->> 'email' = 'booking@fyzioafit.sk'
);

DROP POLICY IF EXISTS "Public can view blocked slots" ON public.blocked_slots;
CREATE POLICY "Public can view blocked slots" ON public.blocked_slots
FOR SELECT TO public
USING (true);

-- 4. Cleanup any potential legacy policies from diagnostic attempts
DROP POLICY IF EXISTS "Nuclear option" ON public.blocked_slots;
