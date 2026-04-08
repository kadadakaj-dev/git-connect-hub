-- Allow separate reminder records per channel (email vs push) for the same booking.
-- Previously booking_id was UNIQUE, meaning only one reminder row per booking.
-- Now we use a composite unique constraint on (booking_id, reminder_type).

ALTER TABLE public.booking_reminders
  DROP CONSTRAINT IF EXISTS booking_reminders_booking_id_key;

ALTER TABLE public.booking_reminders
  DROP CONSTRAINT IF EXISTS booking_reminders_booking_channel_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'booking_reminders_booking_channel_unique'
      AND t.relname = 'booking_reminders'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.booking_reminders
      ADD CONSTRAINT booking_reminders_booking_channel_unique
      UNIQUE (booking_id, reminder_type);
  END IF;
END $$;
