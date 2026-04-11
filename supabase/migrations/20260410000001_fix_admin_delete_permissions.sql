-- Migration: Fix admin delete permissions
-- Date: 2026-04-10
-- Problem: REVOKE DELETE FROM authenticated in rls_lockdown blocked admins from deleting bookings.
--          RLS policy also had a type mismatch (text vs app_role enum) and unreliable app_meta_data check.

-- 1. Restore DELETE and UPDATE for authenticated role
--    RLS policies below will enforce that only admins can actually execute these operations.
GRANT DELETE, UPDATE ON public.bookings TO authenticated;

-- 2. Fix the admin RLS policy — replace fragile checks with direct user_roles lookup + email fallback
DROP POLICY IF EXISTS "Admins have full access" ON public.bookings;

CREATE POLICY "Admins have full access"
ON public.bookings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR (auth.jwt() ->> 'email') = 'booking@fyzioafit.sk'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR (auth.jwt() ->> 'email') = 'booking@fyzioafit.sk'
);
