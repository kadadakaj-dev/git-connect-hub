-- Migration: Production Booking Rules Enforcement
-- Date: 2026-04-08
-- Description: Enforces 36h lead time and strict slot exclusivity (single capacity clinic).

CREATE OR REPLACE FUNCTION public.create_secure_booking(
  p_service_id uuid,
  p_date date,
  p_time_slot text,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_notes text DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_client_request_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id uuid;
  v_now_bratislava timestamp with time zone;
  v_booking_start_bratislava timestamp with time zone;
  v_service_duration integer;
  v_occupied_count integer;
  v_is_blocked boolean;
BEGIN
  -- 1. Setup Timezones (Bratislava for business logic)
  v_now_bratislava := now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Bratislava';
  v_booking_start_bratislava := (p_date::text || ' ' || p_time_slot)::timestamp AT TIME ZONE 'Europe/Bratislava';

  -- 2. Validate 36h Lead Time (Strict Production Requirement)
  IF v_booking_start_bratislava < (v_now_bratislava + interval '36 hours') THEN
    RAISE EXCEPTION 'CRITICAL_ERROR: Advance booking required (min 36h). Current time (Bratislava): %, Requested: %', 
      to_char(v_now_bratislava, 'YYYY-MM-DD HH24:MI'),
      to_char(v_booking_start_bratislava, 'YYYY-MM-DD HH24:MI');
  END IF;

  -- 3. Check if Date is Blocked
  SELECT EXISTS(SELECT 1 FROM public.blocked_dates WHERE date = p_date) INTO v_is_blocked;
  IF v_is_blocked THEN
    RAISE EXCEPTION 'CRITICAL_ERROR: The selected date is fully blocked.';
  END IF;

  -- 4. Get Service Info
  SELECT duration INTO v_service_duration FROM public.services WHERE id = p_service_id;
  IF v_service_duration IS NULL THEN
    RAISE EXCEPTION 'CRITICAL_ERROR: Invalid service ID.';
  END IF;

  -- 5. Slot Exclusivity Logic (Production Rule: One occupied = Blocked for everyone)
  -- Count active bookings at this time slot (regardless of therapist)
  SELECT count(*) INTO v_occupied_count FROM public.bookings
  WHERE date = p_date AND status != 'cancelled'
    AND (
      -- Check if the new booking overflows into an existing one OR an existing one overlaps with the new one
      (time_slot::time, (time_slot::time + (booking_duration || ' minutes')::interval)) OVERLAPS 
      (p_time_slot::time, (p_time_slot::time + (v_service_duration || ' minutes')::interval))
    );

  IF v_occupied_count > 0 THEN
    RAISE EXCEPTION 'CRITICAL_ERROR: The requested time slot is already fully occupied.';
  END IF;

  -- 6. Assign Employee (Internal Logic - pick any active if none provided)
  IF p_employee_id IS NULL THEN
    SELECT id INTO p_employee_id FROM public.employees WHERE is_active = TRUE ORDER BY RANDOM() LIMIT 1;
  END IF;

  -- 7. Insert the booking
  INSERT INTO public.bookings (
    service_id, 
    employee_id, 
    date, 
    time_slot, 
    booking_duration,
    client_name, 
    client_email, 
    client_phone, 
    notes,
    client_request_id
  )
  VALUES (
    p_service_id, 
    p_employee_id, 
    p_date, 
    p_time_slot, 
    v_service_duration,
    p_client_name, 
    p_client_email, 
    p_client_phone, 
    p_notes,
    p_client_request_id
  )
  RETURNING id INTO v_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id
  );
END;
$$;
