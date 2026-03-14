
-- 1. Recreate employees_public view with SECURITY INVOKER so it respects RLS on employees table
-- and filter to only active employees
DROP VIEW IF EXISTS public.employees_public;
CREATE VIEW public.employees_public
WITH (security_invoker = true)
AS
SELECT id, full_name, position, bio_sk, bio_en, is_active, sort_order
FROM public.employees
WHERE is_active = true;

-- 2. Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.employees_public TO anon, authenticated;

-- 3. Fix search_path on functions that are missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
