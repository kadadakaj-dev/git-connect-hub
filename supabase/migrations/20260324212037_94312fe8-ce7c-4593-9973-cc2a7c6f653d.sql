-- Create a view that exposes only slot occupancy data (no personal info)
CREATE OR REPLACE VIEW public.booking_slot_counts AS
SELECT 
  date,
  time_slot,
  booking_duration,
  count(*) as booking_count
FROM public.bookings
WHERE status != 'cancelled'
GROUP BY date, time_slot, booking_duration;

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.booking_slot_counts TO anon;
GRANT SELECT ON public.booking_slot_counts TO authenticated;