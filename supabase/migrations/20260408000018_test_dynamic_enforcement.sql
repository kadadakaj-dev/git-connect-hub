-- DYNAMIC ENFORCEMENT VERIFICATION (Step 5)
CREATE TABLE IF NOT EXISTS public._dynamic_test_report (
  id int PRIMARY KEY,
  test_name text,
  status text,
  details text
);

TRUNCATE public._dynamic_test_report;

DO $$
DECLARE
  v_sid uuid := 'ce777223-62f0-47ec-9b37-30a26d999610';
  v_eid uuid;
BEGIN
  SELECT id INTO v_eid FROM public.employees WHERE is_active = true LIMIT 1;

  -- 1. Update Monday (Day 1) to 10:00 - 14:00
  UPDATE public.time_slots_config SET start_time = '10:00:00', end_time = '14:00:00', is_active = true WHERE day_of_week = 1;

  -- 2. Test Rule 1: Monday 09:30 (Before opening)
  BEGIN
    PERFORM public.create_secure_booking(v_sid, '2026-12-07'::date, '09:30'::text, 'T', 't@t.com', '1', NULL, NULL, NULL);
    INSERT INTO public._dynamic_test_report VALUES (1, 'Monday 09:30 (10:00 Open)', 'FAIL', 'Allowed booking before hours');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._dynamic_test_report VALUES (1, 'Monday 09:30 (10:00 Open)', 'PASS', SQLERRM);
  END;

  -- 3. Test Rule 2: Monday 13:30 (Duration 60m -> 14:30 End)
  BEGIN
    PERFORM public.create_secure_booking(v_sid, '2026-12-07'::date, '13:30'::text, 'T', 't@t.com', '1', NULL, NULL, NULL);
    INSERT INTO public._dynamic_test_report VALUES (2, 'Monday 13:30 (14:00 Close)', 'FAIL', 'Allowed booking after hours');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._dynamic_test_report VALUES (2, 'Monday 13:30 (14:00 Close)', 'PASS', SQLERRM);
  END;

  -- 4. Test Rule 0: Sunday (Closed)
  BEGIN
    PERFORM public.create_secure_booking(v_sid, '2026-12-06'::date, '12:00'::text, 'T', 't@t.com', '1', NULL, NULL, NULL);
    INSERT INTO public._dynamic_test_report VALUES (3, 'Sunday (Closed)', 'FAIL', 'Allowed booking on closed day');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._dynamic_test_report VALUES (3, 'Sunday (Closed)', 'PASS', SQLERRM);
  END;

END $$;

SELECT test_name, status, details FROM public._dynamic_test_report ORDER BY id;
