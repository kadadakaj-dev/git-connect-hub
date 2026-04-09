-- Migration: Dynamic Opening Hours Lockdown
-- Purpose: Sync time_slots_config with business rules and enable dynamic editing

-- 1. Ensure internal data integrity
-- First, handle unique constraint for day_of_week to enable UPSERT
ALTER TABLE public.time_slots_config DROP CONSTRAINT IF EXISTS unique_day_of_week;
ALTER TABLE public.time_slots_config ADD CONSTRAINT unique_day_of_week UNIQUE (day_of_week);

ALTER TABLE public.time_slots_config DROP CONSTRAINT IF EXISTS chk_opening_before_closing;
ALTER TABLE public.time_slots_config
ADD CONSTRAINT chk_opening_before_closing CHECK (start_time < end_time);

-- 2. Populate / Update defaults (09:00 - 18:00) for workdays
-- We use UPSERT path to ensure we don't break existing IDs if they exist
INSERT INTO public.time_slots_config (day_of_week, start_time, end_time, is_active)
VALUES 
  (1, '09:00:00', '18:00:00', true),
  (2, '09:00:00', '18:00:00', true),
  (3, '09:00:00', '18:00:00', true),
  (4, '09:00:00', '18:00:00', true),
  (5, '09:00:00', '18:00:00', true)
ON CONFLICT (day_of_week) DO UPDATE 
SET start_time = EXCLUDED.start_time, 
    end_time = EXCLUDED.end_time, 
    is_active = EXCLUDED.is_active;

-- Ensure weekend is clearly defined if missing
INSERT INTO public.time_slots_config (day_of_week, start_time, end_time, is_active)
VALUES 
  (0, '09:00:00', '18:00:00', false),
  (6, '09:00:00', '18:00:00', false)
ON CONFLICT (day_of_week) DO NOTHING;

-- 3. Update create_secure_booking to use dynamic configuration
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
  v_duration int;
  v_cancellation_token uuid;
  v_final_employee_id uuid;
  v_now timestamp with time zone;
  v_appointment_start timestamp with time zone;
  v_appointment_end timestamp with time zone;
  v_opening_time time;
  v_closing_time time;
  v_is_active boolean;
  v_day_of_week int;
BEGIN
  -- Set server-side timestamp
  v_now := now() AT TIME ZONE 'Europe/Bratislava';
  v_appointment_start := (p_date + p_time_slot::time) AT TIME ZONE 'Europe/Bratislava';
  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- FETCH DYNAMIC OPENING HOURS
  SELECT start_time, end_time, is_active 
  INTO v_opening_time, v_closing_time, v_is_active
  FROM public.time_slots_config 
  WHERE day_of_week = v_day_of_week;

  -- Rule 0: Is the clinic open on this day?
  IF NOT FOUND OR v_is_active = false THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: Clinic is closed on this day.';
  END IF;

  -- Get service duration
  SELECT duration INTO v_duration FROM public.services WHERE id = p_service_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found.';
  END IF;

  v_appointment_end := v_appointment_start + (v_duration || ' minutes')::interval;

  -- Rule 1: Operating Hours (Start)
  IF p_time_slot::time < v_opening_time THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: Booking before opening hours (%) is not allowed.', v_opening_time;
  END IF;

  -- Rule 2: Operating Hours (End)
  IF v_appointment_end::time > v_closing_time THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: Booking must end by %. Your session ends at %.', v_closing_time, v_appointment_end::time;
  END IF;

  -- Rule 3: 36h Minimum Lead Time
  IF v_appointment_start < (v_now + interval '36 hours') THEN
    RAISE EXCEPTION 'BUSINESS_RULE_VIOLATION: Advance booking required (min 36h).';
  END IF;

  -- Rule 4: Atomic Overlap Prevention
  -- We pick the employee if not provided, or verify the provided one
  IF p_employee_id IS NULL THEN
    SELECT id INTO v_final_employee_id FROM public.employees WHERE is_active = true LIMIT 1;
  ELSE
    v_final_employee_id := p_employee_id;
  END IF;

  INSERT INTO public.bookings (
    service_id, employee_id, date, time_slot, booking_duration,
    client_name, client_email, client_phone, notes, status,
    client_request_id
  )
  SELECT 
    p_service_id, v_final_employee_id, p_date, p_time_slot, v_duration,
    p_client_name, p_client_email, p_client_phone, p_notes, 'pending',
    p_client_request_id
  WHERE NOT EXISTS (
    -- Precise overlap check: (start1, end1) OVERLAPS (start2, end2)
    -- In SQL: (S1 < E2) AND (S2 < E1)
    SELECT 1 FROM public.bookings b
    WHERE b.date = p_date
      AND b.employee_id = v_final_employee_id
      AND b.status != 'cancelled'
      AND (p_time_slot::time < (b.time_slot::time + (b.booking_duration || ' minutes')::interval))
      AND (b.time_slot::time < v_appointment_end::time)
  )
  RETURNING id, cancellation_token INTO v_booking_id, v_cancellation_token;

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'This time slot is no longer available. (Double-booking prevention)';
  END IF;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'cancellation_token', v_cancellation_token
  );
END;
$$;
