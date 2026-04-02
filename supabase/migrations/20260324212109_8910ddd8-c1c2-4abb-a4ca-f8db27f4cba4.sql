-- Remove the overly permissive anon SELECT policy
DROP POLICY IF EXISTS "Anon can read booking slots for availability" ON public.bookings;

-- Revert the view to security_definer so it can read bookings without anon having direct access
ALTER VIEW public.booking_slot_counts SET (security_invoker = false);