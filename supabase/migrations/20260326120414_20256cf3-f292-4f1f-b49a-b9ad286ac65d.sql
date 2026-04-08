-- Fix privilege escalation: Drop the overly permissive ALL policy and replace with specific policies
-- The current "Admins can manage roles" ALL policy lets any authenticated user INSERT because
-- ALL = SELECT + INSERT + UPDATE + DELETE, and without WITH CHECK, INSERT is unrestricted.

-- Drop the existing ALL policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Re-create as separate policies with proper WITH CHECK
DROP POLICY IF EXISTS "Admins can select all roles" ON public.user_roles; CREATE POLICY "Admins can select all roles" ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles; CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles; CREATE POLICY "Admins can update roles" ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles; CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
