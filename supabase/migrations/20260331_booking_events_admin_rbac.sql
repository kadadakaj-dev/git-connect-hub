-- Migration to grant administrative access to the booking_events table.
-- Using the existing public.has_role database function for RBAC.

-- 1. Grant SELECT access to users with the 'admin' role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='booking_events'
      AND policyname='booking_events_admin_select'
  ) THEN
    CREATE POLICY booking_events_admin_select
      ON public.booking_events
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 2. Ensure non-admin users cannot see audit logs (implicit by RLS, but for clarity)
-- Note: 'service_role' still has access via its own policy.
