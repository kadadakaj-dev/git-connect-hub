-- Add cancellation_token column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN cancellation_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- Update existing bookings to have tokens
UPDATE public.bookings 
SET cancellation_token = gen_random_uuid() 
WHERE cancellation_token IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.bookings 
ALTER COLUMN cancellation_token SET NOT NULL;

-- Create index for fast token lookup
CREATE INDEX idx_bookings_cancellation_token ON public.bookings(cancellation_token);