DROP POLICY "Public can create bookings" ON public.bookings;

CREATE POLICY "Public can create bookings" ON public.bookings
  FOR INSERT TO public
  WITH CHECK (client_user_id IS NULL OR client_user_id = auth.uid());