-- Migration to implement atomic booking cancellation with timezone support.
-- Fixed syntax error and improved race-condition handling.

DROP FUNCTION IF EXISTS public.cancel_secure_booking(UUID);

CREATE OR REPLACE FUNCTION public.cancel_secure_booking(
  p_cancellation_token UUID
)
RETURNS TABLE (
  booking_id UUID,
  was_already_cancelled BOOLEAN,
  error_code TEXT, -- Added to handle business logic rejections while persisting logs
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  service_id UUID,
  service_name_sk TEXT,
  service_name_en TEXT,
  date DATE,
  time_slot TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_status TEXT;
  v_date DATE;
  v_time_slot TEXT;
  v_now_ba TIMESTAMPTZ;
  v_start_ba TIMESTAMPTZ;
BEGIN
  -- 1) Fetch current state
  SELECT b.id, b.status, b.date, b.time_slot
  INTO v_booking_id, v_status, v_date, v_time_slot
  FROM public.bookings b
  WHERE b.cancellation_token = p_cancellation_token;

  -- Basic check
  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_CANCELLATION_TOKEN';
  END IF;

  -- 2) Idempotency: already cancelled => return was_already_cancelled=true
  IF v_status = 'cancelled' THEN
    -- Log idempotency hit
    INSERT INTO public.booking_events (booking_id, event_type, metadata)
    VALUES (v_booking_id, 'booking_cancel_idempotent_hit', jsonb_build_object('cancellation_token', p_cancellation_token));

    RETURN QUERY
    SELECT
      b.id AS booking_id,
      true AS was_already_cancelled,
      null::text AS error_code,
      b.client_name,
      b.client_email,
      b.client_phone,
      b.service_id,
      s.name_sk AS service_name_sk,
      s.name_en AS service_name_en,
      b.date,
      b.time_slot
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE b.id = v_booking_id;
    
    RETURN; -- Important to stop here
  END IF;

  -- 3) Timezone & Lead Time Validation (10h cutoff)
  v_now_ba := now() AT TIME ZONE 'Europe/Bratislava';
  v_start_ba := (v_date::text || ' ' || v_time_slot)::timestamp AT TIME ZONE 'Europe/Bratislava';

  IF (v_start_ba - v_now_ba) < interval '10 hours' THEN
    -- Log rejection
    INSERT INTO public.booking_events (booking_id, event_type, metadata)
    VALUES (v_booking_id, 'booking_cancel_rejected_too_late', jsonb_build_object(
        'cancellation_token', p_cancellation_token,
        'lead_time_hours', extract(epoch from (v_start_ba - v_now_ba))/3600.0,
        'cutoff_hours', 10
    ));

    RETURN QUERY
    SELECT
      b.id AS booking_id,
      false AS was_already_cancelled,
      'TOO_LATE_TO_CANCEL'::text AS error_code,
      b.client_name,
      b.client_email,
      b.client_phone,
      b.service_id,
      s.name_sk AS service_name_sk,
      s.name_en AS service_name_en,
      b.date,
      b.time_slot
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE b.id = v_booking_id;
    
    RETURN;
  END IF;

  -- 4) Atomic update (race-proof): update only if not cancelled
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = v_booking_id
    AND status != 'cancelled';

  -- 4a) If update didn't affect anything, it means someone else cancelled first (concurrency)
  IF NOT FOUND THEN
    -- Log idempotency hit (race condition case)
    INSERT INTO public.booking_events (booking_id, event_type, metadata)
    VALUES (v_booking_id, 'booking_cancel_idempotent_hit', jsonb_build_object('cancellation_token', p_cancellation_token, 'race_condition', true));

    RETURN QUERY
    SELECT
      b.id AS booking_id,
      true AS was_already_cancelled,
      null::text AS error_code,
      b.client_name,
      b.client_email,
      b.client_phone,
      b.service_id,
      s.name_sk AS service_name_sk,
      s.name_en AS service_name_en,
      b.date,
      b.time_slot
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE b.id = v_booking_id;

    RETURN;
  END IF;

  -- Log successful cancellation
  INSERT INTO public.booking_events (booking_id, event_type, metadata)
  VALUES (v_booking_id, 'booking_cancelled', jsonb_build_object('cancellation_token', p_cancellation_token));

  -- 5) Return success data for notifications (only first successful cancel)
  RETURN QUERY
  SELECT
    b.id AS booking_id,
    false AS was_already_cancelled,
    null::text AS error_code,
    b.client_name,
    b.client_email,
    b.client_phone,
    b.service_id,
    s.name_sk AS service_name_sk,
    s.name_en AS service_name_en,
    b.date,
    b.time_slot
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  WHERE b.id = v_booking_id;

END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.cancel_secure_booking(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_secure_booking(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_secure_booking(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_secure_booking(UUID) TO postgres;
