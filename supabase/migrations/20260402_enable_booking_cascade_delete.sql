-- Migration to enable cascade deletion for bookings
-- This ensures associated audit logs (booking_events) are deleted when a booking is removed.

-- 1. Drop existing restricted foreign key from booking_events
ALTER TABLE IF EXISTS public.booking_events
DROP CONSTRAINT IF EXISTS booking_events_booking_id_fkey;

-- 2. Re-create the foreign key with ON DELETE CASCADE
ALTER TABLE public.booking_events
ADD CONSTRAINT booking_events_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES public.bookings(id)
ON DELETE CASCADE;

-- 3. Ensure other related tables are also cascading (booking_reminders is already CASCADE, but let's be double sure)
ALTER TABLE IF EXISTS public.booking_reminders
DROP CONSTRAINT IF EXISTS booking_reminders_booking_id_fkey;

ALTER TABLE public.booking_reminders
ADD CONSTRAINT booking_reminders_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES public.bookings(id)
ON DELETE CASCADE;
