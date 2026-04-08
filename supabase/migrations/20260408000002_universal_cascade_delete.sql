-- =====================================================================================
-- FYZIO&FIT - UNIVERSAL CASCADE DELETE HARDENING
-- =====================================================================================
-- This migration ensures that deleting a booking automatically removes ALL related
-- records in order to prevent "409 Conflict" errors in the admin dashboard.

-- 1. booking_events (Audit logs) - SET NULL to preserve history for stats
ALTER TABLE IF EXISTS public.booking_events
DROP CONSTRAINT IF EXISTS booking_events_booking_id_fkey;

ALTER TABLE public.booking_events
ADD CONSTRAINT booking_events_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES public.bookings(id)
ON DELETE SET NULL;

-- 2. booking_reminders (Email tracking)
-- Handled in 20260402 migration, but verifying here for robustness.
ALTER TABLE IF EXISTS public.booking_reminders
DROP CONSTRAINT IF EXISTS booking_reminders_booking_id_fkey;

ALTER TABLE public.booking_reminders
ADD CONSTRAINT booking_reminders_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES public.bookings(id)
ON DELETE CASCADE;

-- 3. therapist_notes (Internal notes)
ALTER TABLE IF EXISTS public.therapist_notes
DROP CONSTRAINT IF EXISTS therapist_notes_booking_id_fkey;

ALTER TABLE public.therapist_notes
ADD CONSTRAINT therapist_notes_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES public.bookings(id)
ON DELETE CASCADE;

-- 4. favorite_services (Client favorites)
-- Usually linked to client_profiles, but some schemas link directly to service_id.
-- No change needed here if it doesn't reference bookings.id.
