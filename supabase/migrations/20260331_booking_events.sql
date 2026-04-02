-- Migration to create the audit logging system for bookings.

-- 1. Create the booking_events table
CREATE TABLE IF NOT EXISTS public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add performance indexes
CREATE INDEX IF NOT EXISTS booking_events_booking_id_idx ON public.booking_events(booking_id);
CREATE INDEX IF NOT EXISTS booking_events_event_type_created_at_idx ON public.booking_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_events_created_at_idx ON public.booking_events(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS policies for service_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='booking_events'
      AND policyname='booking_events_service_role_select'
  ) THEN
    CREATE POLICY booking_events_service_role_select
      ON public.booking_events
      FOR SELECT
      TO public
      USING (auth.role() = 'service_role'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='booking_events'
      AND policyname='booking_events_service_role_insert'
  ) THEN
    CREATE POLICY booking_events_service_role_insert
      ON public.booking_events
      FOR INSERT
      TO public
      WITH CHECK (auth.role() = 'service_role'::text);
  END IF;
END $$;

-- 5. Grant permissions to service_role and postgres
GRANT SELECT, INSERT ON public.booking_events TO service_role;
GRANT ALL ON public.booking_events TO postgres;
