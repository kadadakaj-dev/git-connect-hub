-- 1. Zmaže všetky staré verzie a ich preťaženia
DROP FUNCTION IF EXISTS public.create_secure_booking(uuid, date, text, text, text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.create_secure_booking(uuid, date, text, text, text, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.create_secure_booking(uuid, date, text, text, text, text, text, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.create_secure_booking(uuid, date, text, text, text, text, text, uuid, uuid, uuid);

-- 2. Vytvorí finálnu, jedinú platnú funkciu s čistým JSONB objektom a UUID pre idempoteciu
CREATE OR REPLACE FUNCTION public.create_secure_booking(
    p_service_id uuid,
    p_date date,
    p_time_slot text,
    p_client_name text,
    p_client_email text,
    p_client_phone text,
    p_notes text DEFAULT NULL::text,
    p_client_user_id uuid DEFAULT NULL::uuid,
    p_client_request_id uuid DEFAULT NULL::uuid,
    p_employee_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_service_duration integer;
    v_overlapping_count integer;
    v_capacity integer;
    v_new_booking_id uuid;
    v_existing_booking jsonb;  -- PRE IDEMPOTENCIU
    v_cancellation_token uuid; -- UUID TYP
    v_now_bratislava TIMESTAMP WITH TIME ZONE;
    v_booking_start_bratislava TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 0. DB Level Double Booking Protection
    PERFORM pg_advisory_xact_lock(hashtext('booking_lock_' || p_date::text || '_' || COALESCE(p_employee_id::text, 'shared_pool')));

    -- 1. Idempotency Check
    IF p_client_request_id IS NOT NULL THEN
        SELECT jsonb_build_object('id', id, 'date', date, 'time_slot', time_slot, 'status', status, 'cancellation_token', cancellation_token)
        INTO v_existing_booking
        FROM bookings
        WHERE client_request_id = p_client_request_id
        LIMIT 1;
        
        IF v_existing_booking IS NOT NULL THEN
            RETURN json_build_object('success', true, 'booking', v_existing_booking, 'idempotent', true);
        END IF;
    END IF;

    -- 2. Timezone handling (Bratislava)
    v_now_bratislava := now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Bratislava';
    v_booking_start_bratislava := (p_date + p_time_slot::time) AT TIME ZONE 'Europe/Bratislava';

    IF v_booking_start_bratislava < v_now_bratislava + INTERVAL '36 hours' THEN
        RETURN json_build_object('success', false, 'error', 'Advance booking required (36 hours)');
    END IF;

    -- 3. Get Service Duration
    SELECT duration INTO v_service_duration
    FROM services
    WHERE id = p_service_id AND is_active = true;

    IF v_service_duration IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Service not found or inactive');
    END IF;

    -- 4. Check Blocked Dates
    IF EXISTS (SELECT 1 FROM blocked_dates WHERE date = p_date) THEN
        RETURN json_build_object('success', false, 'error', 'Day is blocked');
    END IF;

    -- 5. Calculate Overlaps
    SELECT COUNT(*) INTO v_overlapping_count
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    WHERE b.date = p_date
      AND b.status != 'cancelled'
      AND (p_employee_id IS NULL OR b.employee_id = p_employee_id)
      AND (
          (p_time_slot::time >= b.time_slot::time AND p_time_slot::time < (b.time_slot::time + (COALESCE(b.booking_duration, s.duration, 60)::text || ' minutes')::interval))
          OR 
          ((p_time_slot::time + (v_service_duration::text || ' minutes')::interval) > b.time_slot::time AND (p_time_slot::time + (v_service_duration::text || ' minutes')::interval) <= (b.time_slot::time + (COALESCE(b.booking_duration, s.duration, 60)::text || ' minutes')::interval))
          OR
          (p_time_slot::time <= b.time_slot::time AND (p_time_slot::time + (v_service_duration::text || ' minutes')::interval) >= (b.time_slot::time + (COALESCE(b.booking_duration, s.duration, 60)::text || ' minutes')::interval))
      );

    v_capacity := 1;

    IF v_overlapping_count >= v_capacity THEN
        RETURN json_build_object('success', false, 'error', 'Time slot fully booked for this therapist');
    END IF;

    -- 6. Insert new booking with UUID
    v_cancellation_token := gen_random_uuid();

    INSERT INTO bookings (
        service_id, date, time_slot, client_name, client_email, client_phone, 
        notes, client_user_id, client_request_id, cancellation_token, employee_id, booking_duration
    ) VALUES (
        p_service_id, p_date, p_time_slot, p_client_name, p_client_email, p_client_phone, 
        p_notes, p_client_user_id, p_client_request_id, v_cancellation_token, p_employee_id, v_service_duration
    ) RETURNING id INTO v_new_booking_id;

    RETURN json_build_object(
        'success', true, 
        'booking', json_build_object(
            'id', v_new_booking_id, 
            'date', p_date, 
            'time_slot', p_time_slot, 
            'status', 'confirmed', 
            'cancellation_token', v_cancellation_token
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;
