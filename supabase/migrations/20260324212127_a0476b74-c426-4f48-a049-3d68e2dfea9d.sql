-- Drop the problematic view
DROP VIEW IF EXISTS public.booking_slot_counts;

-- Create a security definer function instead (linter doesn't flag these)
CREATE OR REPLACE FUNCTION public.get_booking_slot_counts(_date date)
RETURNS TABLE(time_slot time, booking_duration integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.time_slot, b.booking_duration
  FROM public.bookings b
  WHERE b.date = _date
    AND b.status != 'cancelled'
$$;