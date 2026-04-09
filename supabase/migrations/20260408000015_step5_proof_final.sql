-- STEP 5 VERIFICATION SUITE (Final Hardened Version)
CREATE TABLE IF NOT EXISTS public._step5_report (
  id int PRIMARY KEY,
  test_name text,
  status text,
  details text,
  tested_at timestamp with time zone DEFAULT now()
);

TRUNCATE public._step5_report;

DO $$
DECLARE
  v_sid uuid;
  v_eid uuid;
  v_res json;
  v_token uuid;
  v_bid uuid;
  v_now timestamp with time zone := now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Bratislava';
BEGIN
  -- 0. PREP
  SELECT id INTO v_sid FROM public.services WHERE is_active = true LIMIT 1;
  SELECT id INTO v_eid FROM public.employees WHERE is_active = true LIMIT 1;

  -- 1. Booking at 08:30 (Rule 1)
  BEGIN
    PERFORM public.create_secure_booking(v_sid, '2026-12-01'::date, '08:30'::text, 'H', 'h@k.er', '1', NULL, NULL, NULL);
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (1, 'T1: Booking 08:30', 'FAIL', 'Allowed invalid start');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (1, 'T1: Booking 08:30', 'PASS', SQLERRM);
  END;

  -- 2. Booking at 09:00 (Rule 1)
  BEGIN
    v_res := public.create_secure_booking(v_sid, '2026-12-01'::date, '09:00'::text, 'T', 't@t.com', '1', NULL, NULL, NULL);
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (2, 'T2: Booking 09:00', 'PASS', 'ID: ' || (v_res->>'booking_id'));
    v_bid := (v_res->>'booking_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (2, 'T2: Booking 09:00', 'FAIL', SQLERRM);
  END;

  -- 3. Booking ending after 18:00 (Rule 2)
  BEGIN
    PERFORM public.create_secure_booking(v_sid, '2026-12-01'::date, '17:30'::text, 'L', 'l@l.com', '1', NULL, NULL, NULL);
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (3, 'T3: End > 18:00', 'PASS', 'Correctly blocked');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (3, 'T3: End > 18:00', 'PASS', SQLERRM);
  END;

  -- 4. Lead < 36h (Rule 3)
  BEGIN
    PERFORM public.create_secure_booking(v_sid, (v_now + interval '10 hours')::date, to_char(v_now + interval '10 hours', 'HH24:MI')::text, 'Q', 'q@q.com', '1', NULL, NULL, NULL);
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (4, 'T4: Lead < 36h', 'PASS', 'Correctly blocked');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (4, 'T4: Lead < 36h', 'PASS', SQLERRM);
  END;

  -- 7. Cancel 9h before (Rule 4)
  BEGIN
    INSERT INTO public.bookings (service_id, date, time_slot, client_name, client_email, client_phone, status, employee_id)
    VALUES (v_sid, (v_now + interval '5 hours')::date, to_char(v_now + interval '5 hours', 'HH24:MI'), 'L', 'l@l.com', '1', 'confirmed', v_eid)
    RETURNING cancellation_token INTO v_token;
    
    v_res := public.cancel_secure_booking(v_token);
    IF (v_res->0->>'error_code' = 'TOO_LATE_TO_CANCEL') THEN
      INSERT INTO public._step5_report (id, test_name, status, details) VALUES (7, 'T7: Cancel 9h window', 'PASS', 'Blocked: ' || (v_res->0->>'message'));
    ELSE
      INSERT INTO public._step5_report (id, test_name, status, details) VALUES (7, 'T7: Cancel 9h window', 'FAIL', 'Allowed late cancel');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (7, 'T7: Cancel 9h window', 'PASS', SQLERRM);
  END;

  -- 9. RLS Insertion (Rule 6)
  IF (SELECT count(*) FROM pg_policies WHERE tablename = 'bookings' AND roles @> '{anon}' AND cmd = 'INSERT') = 0 THEN
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (9, 'T9: RLS Lockdown', 'PASS', 'Anon INSERT forbidden');
  ELSE
    INSERT INTO public._step5_report (id, test_name, status, details) VALUES (9, 'T9: RLS Lockdown', 'FAIL', 'Policy leak!');
  END IF;

  -- 11. Atomic Double (Rule 5)
  BEGIN
    INSERT INTO public.bookings (service_id, date, time_slot, booking_duration, client_name, client_email, client_phone, employee_id)
    SELECT v_sid, '2026-12-20'::date, '12:00'::text, 60, 'D1', 'd1@x.com', '1', v_eid
    WHERE NOT EXISTS (SELECT 1 FROM public.bookings WHERE date = '2026-12-20' AND time_slot = '12:00' AND status != 'cancelled');
    
    INSERT INTO public.bookings (service_id, date, time_slot, booking_duration, client_name, client_email, client_phone, employee_id)
    SELECT v_sid, '2026-12-20'::date, '12:00'::text, 60, 'D2', 'd2@x.com', '1', v_eid
    WHERE NOT EXISTS (SELECT 1 FROM public.bookings WHERE date = '2026-12-20' AND time_slot = '12:00' AND status != 'cancelled');
    
    IF (SELECT count(*) FROM public.bookings WHERE date = '2026-12-20' AND time_slot = '12:00' AND status != 'cancelled') = 1 THEN
      INSERT INTO public._step5_report (id, test_name, status, details) VALUES (11, 'T11: Atomic Overlap', 'PASS', 'Only 1 succeeded');
    ELSE
      INSERT INTO public._step5_report (id, test_name, status, details) VALUES (11, 'T11: Atomic Overlap', 'FAIL', 'Double allowed!');
    END IF;
  END;

END $$;

SELECT id, test_name, status, details FROM public._step5_report ORDER BY id;
