-- Migration: Remove artificial booking-duration buffer for new bookings
-- Date: 2026-05-06
-- Scope:
--   - keep service duration unchanged in public.services.duration
--   - keep 30-minute customer slot grid
--   - remove duration padding in create_secure_booking inserts

CREATE OR REPLACE FUNCTION public.create_secure_booking(
    p_service_id UUID,
    p_date DATE,
    p_time_slot TEXT,
    p_client_name TEXT,
    p_client_email TEXT,
    p_client_phone TEXT,
    p_notes TEXT DEFAULT NULL,
    p_client_user_id UUID DEFAULT NULL,
    p_client_request_id UUID DEFAULT NULL,
    p_employee_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id UUID;
    v_existing_booking JSONB;
    v_service_duration INTEGER;
    v_booking_duration INTEGER;
    v_is_active BOOLEAN;
    v_is_blocked BOOLEAN;
    v_total_capacity INTEGER;
    v_assigned_employee_id UUID;
    v_required_slots INTEGER;
    v_slot_min INTEGER;
    v_check_min INTEGER;
    v_occupied_count INTEGER;
    v_cancellation_token TEXT;
    v_now_bratislava TIMESTAMP WITH TIME ZONE;
    v_booking_start_bratislava TIMESTAMP WITH TIME ZONE;
    v_day_of_week INTEGER;
    v_config_active BOOLEAN;
    v_start_time TIME;
    v_end_time TIME;
BEGIN
    -- 0.1 Opening Hours Enforcement (BACKEND GUARD)
    v_day_of_week := extract(dow from p_date);

    -- Deterministically pick latest config row for the requested day.
    SELECT cfg.is_active, cfg.start_time, cfg.end_time
    INTO v_config_active, v_start_time, v_end_time
    FROM (
        SELECT id, is_active, start_time, end_time, created_at
        FROM public.time_slots_config
        WHERE day_of_week = v_day_of_week
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 1
    ) AS cfg;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No working hours configuration found for this day');
    END IF;

    IF NOT v_config_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'The clinic is closed on this day');
    END IF;

    -- Check that start time is within opening hours
    IF p_time_slot::time < v_start_time THEN
        RETURN jsonb_build_object(
            'success',
            false,
            'error',
            'Requested time is before opening hours (' || to_char(v_start_time, 'HH24:MI') || ')'
        );
    END IF;

    -- 0.2 DB Level Double Booking Protection
    PERFORM pg_advisory_xact_lock(hashtext('booking_lock_' || p_date::text || '_' || COALESCE(p_employee_id::text, 'shared_pool')));

    -- 1. Idempotency Check
    IF p_client_request_id IS NOT NULL THEN
        SELECT jsonb_build_object('id', id, 'date', date, 'time_slot', time_slot, 'status', status, 'cancellation_token', cancellation_token)
        INTO v_existing_booking
        FROM public.bookings
        WHERE client_request_id = p_client_request_id;

        IF v_existing_booking IS NOT NULL THEN
            RETURN jsonb_build_object('success', true, 'booking', v_existing_booking, 'idempotent', true);
        END IF;
    END IF;

    -- 2. Service Validation
    SELECT duration, is_active INTO v_service_duration, v_is_active
    FROM public.services
    WHERE id = p_service_id;

    IF v_service_duration IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Service not found');
    END IF;

    IF NOT v_is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Service is not available');
    END IF;

    -- No artificial buffer: persist exact service duration for new bookings.
    v_booking_duration := v_service_duration;

    -- End-time check: ensure start + actual service duration does not exceed closing time.
    IF (p_time_slot::time + (v_service_duration || ' minutes')::interval)::time > v_end_time THEN
        RETURN jsonb_build_object(
            'success',
            false,
            'error',
            'BUSINESS_RULE_VIOLATION: Booking must end by ' || to_char(v_end_time, 'HH24:MI') ||
            '. Your session ends at ' ||
            to_char((p_time_slot::time + (v_service_duration || ' minutes')::interval)::time, 'HH24:MI')
        );
    END IF;

    -- 3. Blocked Date Check
    SELECT EXISTS(SELECT 1 FROM public.blocked_dates WHERE date = p_date) INTO v_is_blocked;
    IF v_is_blocked THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected date is not available');
    END IF;

    -- 4. Timezone & Lead Time Validation (36h)
    v_now_bratislava := now() AT TIME ZONE 'Europe/Bratislava';
    v_booking_start_bratislava := (p_date::text || ' ' || p_time_slot)::timestamp AT TIME ZONE 'Europe/Bratislava';

    IF v_booking_start_bratislava <= v_now_bratislava THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking date must be in the future');
    END IF;

    IF NOT public.has_role(auth.uid(), 'admin') AND v_booking_start_bratislava < (v_now_bratislava + interval '36 hours') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking must be at least 36 hours in advance');
    END IF;

    -- 5. Capacity & Slot Check
    IF p_employee_id IS NOT NULL THEN
        v_total_capacity := 1;
        v_assigned_employee_id := p_employee_id;
        IF NOT EXISTS (SELECT 1 FROM public.employees WHERE id = p_employee_id AND is_active = true) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Selected therapist is not available');
        END IF;
    ELSE
        SELECT count(*) INTO v_total_capacity FROM public.employees WHERE is_active = true;
        IF v_total_capacity = 0 THEN
            v_total_capacity := 1;
        END IF;
    END IF;

    v_slot_min := (split_part(p_time_slot, ':', 1)::int * 60) + split_part(p_time_slot, ':', 2)::int;
    v_required_slots := ceil(v_booking_duration::float / 30)::int;

    FOR i IN 0..(v_required_slots - 1) LOOP
        v_check_min := v_slot_min + (i * 30);
        SELECT count(*) INTO v_occupied_count FROM public.bookings
        WHERE date = p_date AND status != 'cancelled'
          AND (p_employee_id IS NULL OR employee_id = p_employee_id)
          AND (
            (split_part(time_slot, ':', 1)::int * 60 + split_part(time_slot, ':', 2)::int) <= v_check_min
            AND (split_part(time_slot, ':', 1)::int * 60 + split_part(time_slot, ':', 2)::int + COALESCE(booking_duration, 30)) > v_check_min
          );
        IF v_occupied_count >= v_total_capacity THEN
            RETURN jsonb_build_object('success', false, 'error', 'This time slot is fully booked');
        END IF;
    END LOOP;

    -- 6. Atomic Employee Assignment
    IF v_assigned_employee_id IS NULL THEN
        SELECT e.id INTO v_assigned_employee_id
        FROM public.employees e
        LEFT JOIN (
            SELECT employee_id, count(*) as booking_count
            FROM public.bookings
            WHERE date = p_date AND status != 'cancelled'
            GROUP BY employee_id
        ) b ON e.id = b.employee_id
        WHERE e.is_active = true
        ORDER BY COALESCE(b.booking_count, 0) ASC, e.sort_order ASC
        LIMIT 1;
    END IF;

    -- 7. Insert Booking
    INSERT INTO public.bookings (
        service_id, date, time_slot, client_name, client_email, client_phone,
        notes, status, employee_id, booking_duration, client_user_id, client_request_id
    ) VALUES (
        p_service_id, p_date, p_time_slot, p_client_name, p_client_email, p_client_phone,
        p_notes, 'confirmed', v_assigned_employee_id, v_booking_duration,
        p_client_user_id, p_client_request_id
    )
    RETURNING id, cancellation_token INTO v_booking_id, v_cancellation_token;

    INSERT INTO public.booking_events (booking_id, event_type, metadata)
    VALUES (v_booking_id, 'booking_created', jsonb_build_object(
        'service_id', p_service_id, 'date', p_date, 'time_slot', p_time_slot,
        'client_user_id', p_client_user_id, 'client_request_id', p_client_request_id
    ));

    RETURN jsonb_build_object(
        'success', true,
        'booking', jsonb_build_object(
            'id', v_booking_id, 'date', p_date, 'time_slot', p_time_slot,
            'status', 'confirmed', 'cancellation_token', v_cancellation_token
        )
    );
EXCEPTION
    WHEN unique_violation THEN
        SELECT jsonb_build_object('id', id, 'date', date, 'time_slot', time_slot, 'status', status, 'cancellation_token', cancellation_token)
        INTO v_existing_booking
        FROM public.bookings WHERE client_request_id = p_client_request_id;
        RETURN jsonb_build_object('success', true, 'booking', v_existing_booking, 'idempotent', true);
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
