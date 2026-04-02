
-- Create tables for the booking system

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_sk TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_sk TEXT,
    description_en TEXT,
    duration INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'physiotherapy',
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    bio_sk TEXT,
    bio_en TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time slots configuration table
CREATE TABLE IF NOT EXISTS public.time_slots_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(day_of_week)
);

-- Blocked dates table
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    client_user_id UUID,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    booking_duration INTEGER NOT NULL DEFAULT 30,
    cancellation_token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client profiles table
CREATE TABLE IF NOT EXISTS public.client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'sk',
    total_visits INTEGER NOT NULL DEFAULT 0,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Therapist notes table
CREATE TABLE IF NOT EXISTS public.therapist_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for services (public read, admin write)
CREATE POLICY "Services are publicly viewable"
ON public.services FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL TO authenticated 
USING (auth.role() = 'authenticated');

-- Create policies for employees (public read, admin write)
CREATE POLICY "Employees are publicly viewable"
ON public.employees FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage employees"
ON public.employees FOR ALL TO authenticated 
USING (auth.role() = 'authenticated');

-- Create policies for time_slots_config (public read, admin write)
CREATE POLICY "Time slots are publicly viewable"
ON public.time_slots_config FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage time slots"
ON public.time_slots_config FOR ALL TO authenticated 
USING (auth.role() = 'authenticated');

-- Create policies for blocked_dates (public read, admin write)
CREATE POLICY "Blocked dates are publicly viewable"
ON public.blocked_dates FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage blocked dates"
ON public.blocked_dates FOR ALL TO authenticated 
USING (auth.role() = 'authenticated');

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT TO authenticated 
USING (client_user_id = auth.uid());

CREATE POLICY "Public can create bookings"
ON public.bookings FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users can update their own bookings"
ON public.bookings FOR UPDATE TO authenticated 
USING (client_user_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT TO authenticated 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all bookings"
ON public.bookings FOR ALL TO authenticated 
USING (auth.role() = 'authenticated');

-- Create policies for client_profiles
CREATE POLICY "Users can view their own profile"
ON public.client_profiles FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.client_profiles FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.client_profiles FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Create policies for therapist_notes
CREATE POLICY "Users can view notes on their bookings"
ON public.therapist_notes FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = therapist_notes.booking_id 
        AND b.client_user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage therapist notes"
ON public.therapist_notes FOR ALL TO authenticated 
USING (auth.role() = 'authenticated');

-- Insert default time slots (Mon-Fri 8:00-18:00)
INSERT INTO public.time_slots_config (day_of_week, start_time, end_time, is_active) VALUES
(1, '08:00:00', '18:00:00', true),
(2, '08:00:00', '18:00:00', true),
(3, '08:00:00', '18:00:00', true),
(4, '08:00:00', '18:00:00', true),
(5, '08:00:00', '18:00:00', true)
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO public.services (name_sk, name_en, description_sk, description_en, duration, price, category, icon, is_active, sort_order) VALUES
('Fyzioterapia', 'Physiotherapy', 'Odborná fyzioterapia pre bolesť a rehabilitáciu', 'Professional physiotherapy for pain and rehabilitation', 60, 45.00, 'physiotherapy', 'Activity', true, 1),
('Chiropraxia', 'Chiropractic', 'Chiropraktická liečba chrbtice a kĺbov', 'Chiropractic treatment for spine and joints', 45, 40.00, 'chiropractic', 'User', true, 2),
('Masáž', 'Massage', 'Relaxačná a terapeutická masáž', 'Relaxing and therapeutic massage', 60, 35.00, 'physiotherapy', 'Heart', true, 3)
ON CONFLICT DO NOTHING;
