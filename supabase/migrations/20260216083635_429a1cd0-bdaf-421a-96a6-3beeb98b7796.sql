
-- Drop the overly permissive INSERT policy on bookings
DROP POLICY IF EXISTS "Authenticated users and guests can create bookings" ON public.bookings;

-- Create a stricter INSERT policy: only authenticated users can insert their own bookings
-- (Edge function uses service role key and bypasses RLS anyway)
CREATE POLICY "Authenticated users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (client_user_id = auth.uid());
