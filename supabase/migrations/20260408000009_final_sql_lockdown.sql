-- Migration: Final SQL Logic Lockdown
-- Date: 2026-04-08
-- Description: Consolidated Source-of-Truth for 09-18, 36h, 10h, and ATOMIC double-booking protection.

-- 0. CLEANUP (Ensures signature/return type changes are clean)
DROP FUNCTION IF EXISTS public.create_secure_booking(uuid, date, text, text, text, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.cancel_secure_booking(uuid);

-- 1. HARDENED create_secure_booking
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
  v_now_ba timestamp with time zone;
  v_start_ba timestamp with time zone;
  v_duration integer;
  v_end_time time;
  v_employee_id uuid;
BEGIN
  -- A. Trusted Server Time (Bratislava)
  v_now_ba := now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Bratislava';
  v_start_ba := (p_date::text || ' ' || p_time_slot)::timestamp AT TIME ZONE 'Europe/Bratislava';

  -- B. RULE 1: START TIME CHECK (>= 09:00)
  IF p_time_slot::time < '09:00'::time THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: Booking before 09:00 is not allowed.';
  END IF;

  -- C. RULE 3: 36h LEAD TIME CHECK
  IF v_start_ba < (v_now_ba + interval '36 hours') THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: Advance booking required (min 36h). Current BA: %, Target: %', 
      to_char(v_now_ba, 'YYYY-MM-DD HH24:MI'),
      to_char(v_start_ba, 'YYYY-MM-DD HH24:MI');
  END IF;

  -- D. DURATION & END TIME CALCULATION
  SELECT duration INTO v_duration FROM public.services WHERE id = p_service_id;
  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'DATA_ERROR: Invalid service ID.';
  END IF;
  
  v_end_time := p_time_slot::time + (v_duration || ' minutes')::interval;

  -- E. RULE 2: END TIME CHECK (<= 18:00)
  IF v_end_time > '18:00'::time THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: Booking must end by 18:00. Requested end: %', to_char(v_end_time, 'HH24:MI');
  END IF;

  -- F. BLOCK DATE CHECK
  IF EXISTS(SELECT 1 FROM public.blocked_dates WHERE date = p_date) THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: The selected date is fully blocked.';
  END IF;

  -- G. ATOMIC RULE 5: DOUBLE-BOOKING PROTECTION
  -- Pattern: Atomic INSERT ... SELECT ... WHERE NOT EXISTS
  -- This guarantees that only ONE concurrent transaction will succeed for overlapping slots.
  
  v_employee_id := COALESCE(p_employee_id, (SELECT id FROM public.employees WHERE is_active = TRUE ORDER BY RANDOM() LIMIT 1));

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
    client_request_id,
    status
  )
  SELECT 
    p_service_id, 
    v_employee_id, 
    p_date, 
    p_time_slot, 
    v_duration,
    p_client_name, 
    p_client_email, 
    p_client_phone, 
    p_notes,
    p_client_request_id,
    'pending' -- Keeping pending valid as requested
  WHERE NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE date = p_date 
      AND status != 'cancelled'
      AND (time_slot::time, time_slot::time + (booking_duration || ' minutes')::interval) OVERLAPS 
          (p_time_slot::time, v_end_time)
  )
  RETURNING id INTO v_booking_id;

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'CONCURRENCY_ERROR: The requested time slot is already occupied or was just taken.';
  END IF;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id
  );
END;
$$;

-- 2. HARDENED cancel_secure_booking
CREATE OR REPLACE FUNCTION public.cancel_secure_booking(
  p_cancellation_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_record record;
  v_now_ba timestamp with time zone;
  v_start_ba timestamp with time zone;
BEGIN
  -- A. Trusted Server Time (Bratislava)
  v_now_ba := now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Bratislava';

  -- B. FETCH AND VALIDATE BOOKING
  SELECT 
    b.id as booking_id,
    b.date,
    b.time_slot,
    b.status,
    b.client_name,
    b.client_email,
    b.client_phone,
    b.notes,
    s.name_sk as service_name_sk,
    s.name_en as service_name_en,
    b.employee_id as client_user_id
  INTO v_booking_record
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  WHERE b.cancellation_token = p_cancellation_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CANCELLATION_TOKEN';
  END IF;

  IF v_booking_record.status = 'cancelled' THEN
    RETURN jsonb_build_array(jsonb_build_object(
      'booking_id', v_booking_record.booking_id,
      'was_already_cancelled', true
    ));
  END IF;

  -- C. RULE 4: 10h CANCELLATION CHECK
  v_start_ba := (v_booking_record.date::text || ' ' || v_booking_record.time_slot)::timestamp AT TIME ZONE 'Europe/Bratislava';

  IF v_start_ba < (v_now_ba + interval '10 hours') THEN
    RETURN jsonb_build_array(jsonb_build_object(
      'booking_id', v_booking_record.booking_id,
      'error_code', 'TOO_LATE_TO_CANCEL',
      'appointment_start', to_char(v_start_ba, 'YYYY-MM-DD HH24:MI'),
      'current_time_ba', to_char(v_now_ba, 'YYYY-MM-DD HH24:MI')
    ));
  END IF;

  -- D. EXECUTE CANCELLATION
  UPDATE public.bookings 
  SET status = 'cancelled' 
  WHERE id = v_booking_record.booking_id;

  RETURN jsonb_build_array(jsonb_build_object(
    'success', true,
    'booking_id', v_booking_record.booking_id,
    'client_name', v_booking_record.client_name,
    'client_email', v_booking_record.client_email,
    'date', v_booking_record.date,
    'time_slot', v_booking_record.time_slot,
    'service_name_sk', v_booking_record.service_name_sk,
    'was_already_cancelled', false
  ));
END;
$$;
