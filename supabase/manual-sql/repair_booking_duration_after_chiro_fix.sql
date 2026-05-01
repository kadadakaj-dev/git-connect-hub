-- ============================================================
-- Manual repair script: fix booking_duration for affected bookings
-- File: supabase/manual-sql/repair_booking_duration_after_chiro_fix.sql
--
-- PURPOSE
-- -------
-- booking_duration stores the grid-blocking width (ceil(service.duration/30)*30),
-- not the raw service duration. If a booking was created while a service row had
-- an incorrect duration, the stored booking_duration is also wrong. This script
-- corrects those rows for confirmed/pending future bookings.
--
-- HOW TO USE
-- ----------
-- 1. Open the Supabase SQL Editor for project bqoeopfgivbvyhonkree.
-- 2. Run STEP 1 (services verification) and confirm the chiro service durations.
-- 3. Run STEP 2 (booking verification SELECT) and review EVERY returned row.
-- 4. Only run STEP 3 (repair UPDATE) after you are satisfied that the rows
--    listed by STEP 2 are exactly the ones that need fixing.
--    Remove the comment markers around the UPDATE before executing.
--
-- DO NOT run this file automatically via `supabase db push`.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- STEP 1: Verify service rows (run first, no side effects)
-- ──────────────────────────────────────────────────────────────
-- Confirm that the chiro service durations are correct in Supabase
-- before attempting the booking repair. Expected results:
--   Chiro masáž           → duration 50, price 55
--   Chiropraxia/Naprávanie → duration 15, price 30
--   Celotelová chiro masáž → duration 90, price 75

SELECT
    id,
    name_sk,
    name_en,
    category,
    price,
    duration,
    is_active,
    sort_order
FROM public.services
WHERE
    name_sk ILIKE '%chiro%'
    OR name_sk ILIKE '%napráv%'
    OR name_sk ILIKE '%naprav%'
    OR name_sk ILIKE '%celotel%'
ORDER BY sort_order;


-- ──────────────────────────────────────────────────────────────
-- STEP 2: Identify affected bookings (no side effects)
-- ──────────────────────────────────────────────────────────────
-- Returns every confirmed/pending future booking where the stored
-- booking_duration does not match ceil(service.duration/30)*30.
-- Review each row before proceeding to the repair.

SELECT
    b.id                                          AS booking_id,
    b.date,
    b.time_slot,
    b.status,
    b.booking_duration                            AS stored_booking_duration,
    s.name_sk                                     AS service_name,
    s.duration                                    AS service_duration_min,
    (ceil(s.duration::float / 30) * 30)::int      AS correct_booking_duration
FROM public.bookings b
JOIN public.services s ON b.service_id = s.id
WHERE b.status IN ('confirmed', 'pending')
  AND b.date >= CURRENT_DATE
  AND (ceil(s.duration::float / 30) * 30)::int != b.booking_duration
ORDER BY b.date, b.time_slot;


-- ──────────────────────────────────────────────────────────────
-- STEP 3: Repair UPDATE (commented out — uncomment after STEP 2)
-- ──────────────────────────────────────────────────────────────
-- Run this ONLY after reviewing the STEP 2 output.
-- It updates booking_duration to match the current service duration,
-- targeting only confirmed/pending future bookings that are mismatched.
-- No other columns or past/cancelled bookings are touched.

-- UPDATE public.bookings b
-- SET
--     booking_duration = (ceil(s.duration::float / 30) * 30)::int,
--     updated_at       = now()
-- FROM public.services s
-- WHERE b.service_id = s.id
--   AND b.status IN ('confirmed', 'pending')
--   AND b.date >= CURRENT_DATE
--   AND (ceil(s.duration::float / 30) * 30)::int != b.booking_duration;

-- After running the UPDATE, re-run the STEP 2 SELECT to confirm 0 rows returned.
