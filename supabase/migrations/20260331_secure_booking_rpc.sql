-- Migration to stabilize the booking system with atomicity, timezone support, and idempotency.

-- 1. Add client_request_id and ensure employee_id is handled correctly
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_request_id') THEN
        ALTER TABLE public.bookings ADD COLUMN client_request_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'employee_id') THEN
        ALTER TABLE public.bookings ADD COLUMN employee_id UUID REFERENCES public.employees(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_duration') THEN
        ALTER TABLE public.bookings ADD COLUMN booking_duration INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_user_id') THEN
        ALTER TABLE public.bookings ADD COLUMN client_user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Add unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_client_request_id ON public.bookings (client_request_id) WHERE client_request_id IS NOT NULL;

-- 3. Create/Update the secure booking function
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
BEGIN
    -- 1. Idempotency Check
    IF p_client_request_id IS NOT NULL THEN
        SELECT jsonb_build_object('id', id, 'date', date, 'time_slot', time_slot, 'status', status, 'cancellation_token', cancellation_token)
        INTO v_existing_booking
        FROM public.bookings
        WHERE client_request_id = p_client_request_id;
        
        IF v_existing_booking IS NOT NULL THEN
            -- Log idempotency hit
            INSERT INTO public.booking_events (booking_id, event_type, metadata)
            VALUES ((v_existing_booking->>'id')::uuid, 'booking_idempotent_hit', jsonb_build_object('client_request_id', p_client_request_id));

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

    v_booking_duration := ceil(v_service_duration::float / 30) * 30;

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

    IF v_booking_start_bratislava < (v_now_bratislava + interval '36 hours') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking must be at least 36 hours in advance');
    END IF;

    -- 5. Capacity & Slot Check
    IF p_employee_id IS NOT NULL THEN
        -- If specific employee requested, capacity for that person is 1
        v_total_capacity := 1;
        v_assigned_employee_id := p_employee_id;
        
        -- Validate employee exists and is active
        IF NOT EXISTS (SELECT 1 FROM public.employees WHERE id = p_employee_id AND is_active = true) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Selected therapist is not available');
        END IF;
    ELSE
        -- Get total active employee count for shared pool
        SELECT count(*) INTO v_total_capacity FROM public.employees WHERE is_active = true;
        IF v_total_capacity = 0 THEN v_total_capacity := 1; END IF;
    END IF;

    -- Calculate slots (30min intervals)
    v_slot_min := (split_part(p_time_slot, ':', 1)::int * 60) + split_part(p_time_slot, ':', 2)::int;
    v_required_slots := v_booking_duration / 30;

    FOR i IN 0..(v_required_slots - 1) LOOP
        v_check_min := v_slot_min + (i * 30);
        
        -- Check how many concurrent bookings exist for this 30min chunk
        SELECT count(*) INTO v_occupied_count
        FROM public.bookings
        WHERE date = p_date
          AND status != 'cancelled'
          AND (p_employee_id IS NULL OR employee_id = p_employee_id)
          AND (
            (split_part(time_slot, ':', 1)::int * 60 + split_part(time_slot, ':', 2)::int) <= v_check_min
            AND (split_part(time_slot, ':', 1)::int * 60 + split_part(time_slot, ':', 2)::int + COALESCE(booking_duration, 30)) > v_check_min
          );
          
        IF v_occupied_count >= v_total_capacity THEN
            RETURN jsonb_build_object('success', false, 'error', 'This time slot is fully booked');
        END IF;
    END LOOP;

    -- 6. Atomic Employee Assignment (Skip if provided)
    IF v_assigned_employee_id IS NULL THEN
        -- Pick employee with fewest confirmed bookings on that date (Round-robin)
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
        service_id,
        date,
        time_slot,
        client_name,
        client_email,
        client_phone,
        notes,
        status,
        employee_id,
        booking_duration,
        client_user_id,
        client_request_id
    ) VALUES (
        p_service_id,
        p_date,
        p_time_slot,
        p_client_name,
        p_client_email,
        p_client_phone,
        p_notes,
        'confirmed', -- Auto-confirmed as no online payment is required
        v_assigned_employee_id,
        v_booking_duration,
        p_client_user_id,
        p_client_request_id
    )
    RETURNING id, cancellation_token INTO v_booking_id, v_cancellation_token;

    -- Log successful booking creation
    INSERT INTO public.booking_events (booking_id, event_type, metadata)
    VALUES (v_booking_id, 'booking_created', jsonb_build_object(
        'service_id', p_service_id,
        'date', p_date,
        'time_slot', p_time_slot,
        'client_user_id', p_client_user_id,
        'client_request_id', p_client_request_id
    ));

    RETURN jsonb_build_object(
        'success', true,
        'booking', jsonb_build_object(
            'id', v_booking_id,
            'date', p_date,
            'time_slot', p_time_slot,
            'status', 'confirmed',
            'cancellation_token', v_cancellation_token
        )
    );
EXCEPTION 
    WHEN unique_violation THEN
        -- Fallback for high-concurrency race on unique client_request_id
        SELECT jsonb_build_object('id', id, 'date', date, 'time_slot', time_slot, 'status', status, 'cancellation_token', cancellation_token)
        INTO v_existing_booking
        FROM public.bookings
        WHERE client_request_id = p_client_request_id;
        
        -- Log idempotency hit (race condition case)
        INSERT INTO public.booking_events (booking_id, event_type, metadata)
        VALUES ((v_existing_booking->>'id')::uuid, 'booking_idempotent_hit', jsonb_build_object('client_request_id', p_client_request_id, 'race_condition', true));

        RETURN jsonb_build_object('success', true, 'booking', v_existing_booking, 'idempotent', true);
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
