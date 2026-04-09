-- Fix: Saturday and Sunday must be closed by default
-- Admin can re-enable via /admin → Otváracie hodiny if needed

UPDATE public.time_slots_config
SET is_active = false
WHERE day_of_week IN (0, 6); -- 0 = Sunday, 6 = Saturday

-- Also reset all active days to correct 09:00-18:00 (fix any leftover 19:00 from old migrations)
UPDATE public.time_slots_config
SET start_time = '09:00:00', end_time = '18:00:00'
WHERE day_of_week BETWEEN 1 AND 5 AND is_active = true;
