-- 1. Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- 2. Fix bookings policies
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings; CREATE POLICY "Admins can manage all bookings" ON public.bookings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Fix blocked_dates policies
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON public.blocked_dates;

DROP POLICY IF EXISTS "Admins can manage blocked dates" ON public.blocked_dates; CREATE POLICY "Admins can manage blocked dates" ON public.blocked_dates
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Fix employees policies
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;

DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees; CREATE POLICY "Admins can manage employees" ON public.employees
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix services policies
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

DROP POLICY IF EXISTS "Admins can manage services" ON public.services; CREATE POLICY "Admins can manage services" ON public.services
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Fix time_slots_config policies
DROP POLICY IF EXISTS "Admins can manage time slots" ON public.time_slots_config;

DROP POLICY IF EXISTS "Admins can manage time slots" ON public.time_slots_config; CREATE POLICY "Admins can manage time slots" ON public.time_slots_config
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Fix user_roles policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles; CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Fix therapist_notes policies
DROP POLICY IF EXISTS "Admins can manage therapist notes" ON public.therapist_notes;

DROP POLICY IF EXISTS "Admins can manage therapist notes" ON public.therapist_notes; CREATE POLICY "Admins can manage therapist notes" ON public.therapist_notes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
