-- Migration: Disable Saturday bookings in the configuration
-- Date: 2026-04-01

UPDATE public.time_slots_config
SET is_active = false
WHERE day_of_week = 6;
