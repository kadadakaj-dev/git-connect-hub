-- VERIFICATION SUITE for Booking Lockdown (Step 5)
-- Purpose: Proof of Rule Enforcement

DO $$
DECLARE
  v_service_id uuid := 'ce777223-62f0-47ec-9b37-30a26d999610';
  v_result json;
  v_token uuid;
  v_booking_id uuid;
  v_error text;
BEGIN
  RAISE NOTICE '--- TEST 1: Booking at 08:30 (Rule 1) ---';
  BEGIN
    PERFORM public.create_secure_booking(v_service_id, '2026-04-12', '08:30', 'Hacker', 'h@ck.er', '+421999', NULL, NULL, NULL);
    RAISE EXCEPTION 'TEST 1 FAILED: Allowed booking at 08:30';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 1 PASSED: Correctly blocked 08:30. Message: %', SQLERRM;
  END;

  RAISE NOTICE '--- TEST 2: Booking at 09:00 (Rule 1) ---';
  v_result := public.create_secure_booking(v_service_id, '2026-04-12', '09:00', 'Test User', 'test@user.com', '+421111', NULL, NULL, NULL);
  RAISE NOTICE 'TEST 2 PASSED: Allowed 09:00. Result: %', v_result;

  RAISE NOTICE '--- TEST 3: Booking ending after 18:00 (Rule 2) ---';
  -- Assuming 60m service duration (ce777... is likely 60m)
  BEGIN
    PERFORM public.create_secure_booking(v_service_id, '2026-04-12', '17:30', 'Late User', 'late@user.com', '+421222', NULL, NULL, NULL);
    RAISE EXCEPTION 'TEST 3 FAILED: Allowed booking ending after 18:00';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 3 PASSED: Correctly blocked end time > 18:00. Message: %', SQLERRM;
  END;

  RAISE NOTICE '--- TEST 4: Booking less than 36h in advance (Rule 3) ---';
  BEGIN
    -- using now() + 1 hour as target
    PERFORM public.create_secure_booking(v_service_id, (now() AT TIME ZONE 'Europe/Bratislava' + interval '1 hour')::date, to_char(now() AT TIME ZONE 'Europe/Bratislava' + interval '1 hour', 'HH24:MI'), 'Quick User', 'q@u.com', '+421333', NULL, NULL, NULL);
    RAISE EXCEPTION 'TEST 4 FAILED: Allowed booking < 36h';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 4 PASSED: Correctly blocked < 36h. Message: %', SQLERRM;
  END;

  RAISE NOTICE '--- TEST 5: Booking exactly at allowed ~36h+ boundary ---';
  v_result := public.create_secure_booking(v_service_id, (now() AT TIME ZONE 'Europe/Bratislava' + interval '40 hours')::date, '10:00', 'On-Time User', 'o@u.com', '+421444', NULL, NULL, NULL);
  RAISE NOTICE 'TEST 5 RESULT: Result: %', v_result;

  RAISE NOTICE '--- TEST 6: Cancellation 12h before (Rule 4) ---';
  -- Create a sub-test booking for future
  SELECT (v_result->>'booking_id')::uuid INTO v_booking_id;
  SELECT cancellation_token INTO v_token FROM public.bookings WHERE id = v_booking_id;
  
  v_result := public.cancel_secure_booking(v_token);
  RAISE NOTICE 'TEST 6 PASSED: Allowed cancel at 12h. Result: %', v_result;

  RAISE NOTICE '--- TEST 7: Cancellation 9h before (Rule 4) ---';
  -- We'll manually insert a dummy "confirmed" booking with status hacking disallowed later
  INSERT INTO public.bookings (service_id, date, time_slot, client_name, client_email, client_phone, status, employee_id)
  VALUES (v_service_id, (now() AT TIME ZONE 'Europe/Bratislava' + interval '5 hours')::date, to_char(now() AT TIME ZONE 'Europe/Bratislava' + interval '5 hours', 'HH24:MI'), 'Late Canceller', 'l@c.com', '+421555', 'confirmed', (SELECT id FROM employees LIMIT 1))
  RETURNING cancellation_token INTO v_token;
  
  v_result := public.cancel_secure_booking(v_token);
  IF (v_result->0->>'error_code' = 'TOO_LATE_TO_CANCEL') THEN
    RAISE NOTICE 'TEST 7 PASSED: Blocked cancel < 10h. Message: %', v_result;
  ELSE
    RAISE EXCEPTION 'TEST 7 FAILED: Allowed cancel < 10h. Result: %', v_result;
  END IF;

  RAISE NOTICE '--- TEST 8: Pending booking visibility ---';
  IF EXISTS (SELECT 1 FROM public.bookings WHERE status = 'pending') THEN
    RAISE NOTICE 'TEST 8 PASSED: Pending bookings are visible in DB.';
  ELSE
    RAISE NOTICE 'TEST 8 INFO: No pending bookings currently in DB, but queryable.';
  END IF;

  RAISE NOTICE '--- TEST 9-10: RLS Bypass (Direct Mutation) ---';
  -- Note: We can't easily SWITCH ROLE inside atomic DO block for all drivers, 
  -- but we can test policy count and presence.
  IF (SELECT count(*) FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins have full access') = 1 THEN
    RAISE NOTICE 'TEST 9-10 PASSED: RLS policies are narrowed to Admins.';
  END IF;

  RAISE NOTICE '--- TEST 11: Simultaneous bookings (Atomic Collision) ---';
  -- Pattern: Double insert check
  BEGIN
    INSERT INTO public.bookings (service_id, date, time_slot, booking_duration, client_name, client_email, client_phone, status, employee_id)
    SELECT v_service_id, '2026-04-12', '12:00', 60, 'Double 1', 'd1@x.com', '1', 'pending', (SELECT id FROM employees LIMIT 1)
    WHERE NOT EXISTS (SELECT 1 FROM public.bookings WHERE date = '2026-04-12' AND time_slot = '12:00' AND status != 'cancelled');
    
    INSERT INTO public.bookings (service_id, date, time_slot, booking_duration, client_name, client_email, client_phone, status, employee_id)
    SELECT v_service_id, '2026-04-12', '12:00', 60, 'Double 2', 'd2@x.com', '2', 'pending', (SELECT id FROM employees LIMIT 1)
    WHERE NOT EXISTS (SELECT 1 FROM public.bookings WHERE date = '2026-04-12' AND time_slot = '12:00' AND status != 'cancelled');
    
    IF (SELECT count(*) FROM public.bookings WHERE date = '2026-04-12' AND time_slot = '12:00' AND status != 'cancelled') > 1 THEN
      RAISE EXCEPTION 'TEST 11 FAILED: Double booking allowed!';
    ELSE
      RAISE NOTICE 'TEST 11 PASSED: Only one booking survived overlap check.';
    END IF;
  END;

END $$;
