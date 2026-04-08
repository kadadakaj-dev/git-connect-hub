
-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT NOT NULL DEFAULT 'therapist',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  bio_sk TEXT,
  bio_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Admin can manage employees
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees; CREATE POLICY "Admins can manage employees" ON public.employees
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active employees (for public display)
DROP POLICY IF EXISTS "Anyone can view active employees" ON public.employees; CREATE POLICY "Anyone can view active employees" ON public.employees
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

