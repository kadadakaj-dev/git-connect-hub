-- Migration: Restore get_booking_slot_counts RPC function with proper type casting
-- Date: 2026-04-01
-- Issue: Function was missing, causing 404 errors in booking UI
-- Fix: Cast time_slot from text to time type

CREATE OR REPLACE FUNCTION public.get_booking_slot_counts(_date date, _employee_id uuid DEFAULT NULL)
RETURNS TABLE(time_slot time, booking_duration integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.time_slot::time, b.booking_duration
  FROM public.bookings b
  WHERE b.date = _date
    AND b.status != 'cancelled'
    AND (_employee_id IS NULL OR b.employee_id = _employee_id)
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_booking_slot_counts TO anon, authenticated, service_role;
