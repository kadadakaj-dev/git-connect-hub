
-- Create a view with only non-sensitive columns
CREATE VIEW public.employees_public AS
SELECT id, full_name, position, bio_sk, bio_en, is_active, sort_order
FROM public.employees
WHERE is_active = true;

-- Drop the overly permissive public SELECT policy
DROP POLICY "Employees are publicly viewable" ON public.employees;

-- Grant public access to the view instead
GRANT SELECT ON public.employees_public TO anon, authenticated;
