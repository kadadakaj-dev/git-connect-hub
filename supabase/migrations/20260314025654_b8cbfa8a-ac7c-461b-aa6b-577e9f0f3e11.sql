
-- Add public SELECT policy on employees table for active records only
-- This allows the SECURITY INVOKER view (employees_public) to work for anonymous users
DROP POLICY IF EXISTS "Active employees are publicly viewable" ON public.employees; CREATE POLICY "Active employees are publicly viewable" ON public.employees
FOR SELECT
TO public
USING (is_active = true);

