
-- Migration: Create blocked_slots table and update availability logic
-- Date: 2026-04-08

-- 1. Create blocked_slots table
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    therapist_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON public.blocked_slots;
CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots
FOR ALL TO authenticated
USING (true);

-- Public can view (needed for availability checks during booking)
DROP POLICY IF EXISTS "Public can view blocked slots" ON public.blocked_slots;
CREATE POLICY "Public can view blocked slots" ON public.blocked_slots
FOR SELECT TO public
USING (true);

-- 4. Update RPC to include blocked slots in availability counts
CREATE OR REPLACE FUNCTION public.get_booking_slot_counts(_date date, _employee_id uuid DEFAULT NULL)
RETURNS TABLE(time_slot time, booking_duration integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Real customer bookings
  SELECT b.time_slot::time, b.booking_duration
  FROM public.bookings b
  WHERE b.date = _date
    AND b.status != 'cancelled'
    AND (_employee_id IS NULL OR b.employee_id = _employee_id)
  UNION ALL
  -- Administrative time blocks
  SELECT s.time_slot, s.duration
  FROM public.blocked_slots s
  WHERE s.date = _date
    AND (_employee_id IS NULL OR s.therapist_id = _employee_id)
$$;

-- Grant permissions (just in case)
GRANT SELECT ON public.blocked_slots TO anon, authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
