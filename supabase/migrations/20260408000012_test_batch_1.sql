-- TEST BATCH 1: Rules 1-4
-- 1. 08:30 Check
SELECT 'TEST 1: 08:30 (Rule 1) SHOULD FAIL' as test_case;
SELECT public.create_secure_booking('ce777223-62f0-47ec-9b37-30a26d999610', '2026-04-12', '08:30', 'Hacker', 'h@ck.er', '+421999');

-- 2. 09:00 Check
SELECT 'TEST 2: 09:00 (Rule 1) SHOULD PASS' as test_case;
SELECT public.create_secure_booking('ce777223-62f0-47ec-9b37-30a26d999610', '2026-04-12', '09:00', 'Test User', 'test@user.com', '+421111');

-- 3. >18:00 Check
SELECT 'TEST 3: End > 18:00 (Rule 2) SHOULD FAIL' as test_case;
SELECT public.create_secure_booking('ce777223-62f0-47ec-9b37-30a26d999610', '2026-04-12', '17:30', 'Late User', 'late@user.com', '+421222');

-- 4. < 36h Check
SELECT 'TEST 4: Lead < 36h (Rule 3) SHOULD FAIL' as test_case;
SELECT public.create_secure_booking('ce777223-62f0-47ec-9b37-30a26d999610', (now() AT TIME ZONE 'Europe/Bratislava' + interval '1 hour')::date, to_char(now() AT TIME ZONE 'Europe/Bratislava' + interval '1 hour', 'HH24:MI'), 'Quick User', 'q@u.com', '+421333');
