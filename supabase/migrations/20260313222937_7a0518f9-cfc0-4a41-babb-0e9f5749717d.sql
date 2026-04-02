
-- Add missing favorite_services table
CREATE TABLE IF NOT EXISTS public.favorite_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add user_roles table for admin functionality
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Add employee_id to bookings if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='employee_id') THEN
        ALTER TABLE public.bookings ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.favorite_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for favorite_services
CREATE POLICY "Users can view their own favorites"
ON public.favorite_services FOR SELECT TO authenticated 
USING (client_id = auth.uid());

CREATE POLICY "Users can add their own favorites"
ON public.favorite_services FOR INSERT TO authenticated 
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can delete their own favorites"
ON public.favorite_services FOR DELETE TO authenticated 
USING (client_id = auth.uid());

-- Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated 
USING (auth.role() = 'authenticated');

-- Insert default admin user (will need to be updated with real user ID)
INSERT INTO public.user_roles (user_id, role) VALUES
('00000000-0000-0000-0000-000000000000', 'admin')
ON CONFLICT DO NOTHING;
