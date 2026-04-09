-- RPC: Get Opening Hours Conflicts
-- Purpose: Detect future bookings that will fall outside proposed business hours

CREATE OR REPLACE FUNCTION public.get_opening_hours_conflicts(
  p_day_of_week int,
  p_new_start_time time,
  p_new_end_time time
)
RETURNS TABLE (
  booking_id uuid,
  booking_date date,
  booking_time time,
  client_name text,
  service_name_sk text,
  service_name_en text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.date,
    b.time_slot::time,
    b.client_name,
    s.name_sk,
    s.name_en
  FROM public.bookings b
  JOIN public.services s ON b.service_id = s.id
  WHERE 
    -- Only future bookings
    b.date >= CURRENT_DATE
    AND b.status IN ('pending', 'confirmed')
    -- Filter by day of week
    AND EXTRACT(DOW FROM b.date) = p_day_of_week
    -- Conflict logic: 
    -- 1. Starts before new opening time
    -- 2. Ends after new closing time (start + duration)
    AND (
      (b.time_slot::time < p_new_start_time)
      OR 
      ((b.time_slot::time + (b.booking_duration || ' minutes')::interval)::time > p_new_end_time)
    )
  ORDER BY b.date, b.time_slot;
END;
$$;
