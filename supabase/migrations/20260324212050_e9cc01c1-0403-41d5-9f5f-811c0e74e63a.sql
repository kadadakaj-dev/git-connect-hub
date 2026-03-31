-- Make the view use invoker's permissions
ALTER VIEW public.booking_slot_counts SET (security_invoker = true);

-- Add a SELECT policy on bookings for anon to read only time_slot and booking_duration
-- This is needed so the security_invoker view can read through RLS
CREATE POLICY "Anon can read booking slots for availability"
ON public.bookings
FOR SELECT
TO anon
USING (status != 'cancelled');