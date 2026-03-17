-- Allow separate reminder records per channel (email vs push) for the same booking.
-- Previously booking_id was UNIQUE, meaning only one reminder row per booking.
-- Now we use a composite unique constraint on (booking_id, reminder_type).

ALTER TABLE public.booking_reminders DROP CONSTRAINT IF EXISTS booking_reminders_booking_id_key;

ALTER TABLE public.booking_reminders
  ADD CONSTRAINT booking_reminders_booking_channel_unique UNIQUE (booking_id, reminder_type);
