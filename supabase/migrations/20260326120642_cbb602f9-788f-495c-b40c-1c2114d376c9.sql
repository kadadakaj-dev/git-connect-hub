-- Fix: Remove public INSERT policy on bookings table
-- All bookings should go exclusively through the create-booking edge function
-- which uses service_role key and enforces all business logic validations
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;