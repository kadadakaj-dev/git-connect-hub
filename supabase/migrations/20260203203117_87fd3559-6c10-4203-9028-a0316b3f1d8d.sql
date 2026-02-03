-- Fix all RESTRICTIVE policies - change them to PERMISSIVE (default)
-- This is critical because RESTRICTIVE policies require at least one PERMISSIVE policy to work

-- =====================
-- user_roles table
-- =====================
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- services table
-- =====================
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;

CREATE POLICY "Anyone can view active services"
ON services FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- bookings table
-- =====================
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

CREATE POLICY "Anyone can create bookings"
ON bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings"
ON bookings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bookings"
ON bookings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- time_slots_config table
-- =====================
DROP POLICY IF EXISTS "Anyone can view time slots config" ON time_slots_config;
DROP POLICY IF EXISTS "Admins can manage time slots config" ON time_slots_config;

CREATE POLICY "Anyone can view time slots config"
ON time_slots_config FOR SELECT
USING (true);

CREATE POLICY "Admins can manage time slots config"
ON time_slots_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- blocked_dates table
-- =====================
DROP POLICY IF EXISTS "Anyone can view blocked dates" ON blocked_dates;
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON blocked_dates;

CREATE POLICY "Anyone can view blocked dates"
ON blocked_dates FOR SELECT
USING (true);

CREATE POLICY "Admins can manage blocked dates"
ON blocked_dates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));