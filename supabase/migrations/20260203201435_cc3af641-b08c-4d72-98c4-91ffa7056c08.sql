-- Create services table with multilingual support
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_sk TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_sk TEXT NOT NULL,
  description_en TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('physiotherapy', 'chiropractic')),
  icon TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_slots configuration table
CREATE TABLE public.time_slots_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked dates table (for holidays, vacations)
CREATE TABLE public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Services: Everyone can view active services
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

-- Services: Only admins can manage services
CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bookings: Anyone can create a booking (public form)
CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- Bookings: Only admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Bookings: Only admins can update bookings
CREATE POLICY "Admins can update bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bookings: Only admins can delete bookings
CREATE POLICY "Admins can delete bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Time slots config: Anyone can view
CREATE POLICY "Anyone can view time slots config"
ON public.time_slots_config FOR SELECT
USING (true);

-- Time slots config: Only admins can manage
CREATE POLICY "Admins can manage time slots config"
ON public.time_slots_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Blocked dates: Anyone can view
CREATE POLICY "Anyone can view blocked dates"
ON public.blocked_dates FOR SELECT
USING (true);

-- Blocked dates: Only admins can manage
CREATE POLICY "Admins can manage blocked dates"
ON public.blocked_dates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample services
INSERT INTO public.services (name_sk, name_en, description_sk, description_en, duration, price, category, icon, sort_order) VALUES
('Úvodné vyšetrenie', 'Initial Examination', 'Komplexné prvotné vyšetrenie vrátane analýzy držania tela, testov pohyblivosti a personalizovaného liečebného plánu.', 'Comprehensive first-time assessment including posture analysis, mobility tests, and personalized treatment plan.', 60, 120.00, 'physiotherapy', 'ClipboardCheck', 1),
('Fyzioterapeutické sedenie', 'Physiotherapy Session', 'Cielené terapeutické sedenie zamerané na rehabilitáciu, úľavu od bolesti a zlepšenie pohyblivosti.', 'Targeted treatment session focusing on rehabilitation, pain relief, and improved mobility.', 45, 85.00, 'physiotherapy', 'Activity', 2),
('Chiropraktická úprava', 'Chiropractic Adjustment', 'Manipulácia chrbtice a úpravy na obnovenie správneho postavenia a funkcie nervového systému.', 'Spinal manipulation and adjustments to restore proper alignment and nervous system function.', 30, 75.00, 'chiropractic', 'Bone', 3),
('Športová terapia', 'Sports Therapy', 'Špecializovaná liečba pre športovcov a aktívnych jednotlivcov zotavujúcich sa zo športových zranení.', 'Specialized treatment for athletes and active individuals recovering from sports injuries.', 50, 95.00, 'physiotherapy', 'Dumbbell', 4),
('Masážna terapia', 'Massage Therapy', 'Terapeutická masáž na uvoľnenie svalového napätia, zlepšenie krvného obehu a podporu relaxácie.', 'Therapeutic massage to relieve muscle tension, improve circulation, and promote relaxation.', 60, 90.00, 'physiotherapy', 'Hand', 5),
('Kontrolná konzultácia', 'Follow-up Consultation', 'Prehľad pokroku a úprava liečby na základe vašej cesty k zotaveniu.', 'Progress review and treatment adjustment based on your recovery journey.', 30, 60.00, 'physiotherapy', 'MessageSquare', 6);

-- Insert default time slots configuration
INSERT INTO public.time_slots_config (day_of_week, start_time, end_time, is_active) VALUES
(1, '09:00', '18:00', true), -- Monday
(2, '09:00', '18:00', true), -- Tuesday
(3, '09:00', '18:00', true), -- Wednesday
(4, '09:00', '18:00', true), -- Thursday
(5, '09:00', '18:00', true), -- Friday
(6, '09:00', '14:00', true), -- Saturday
(0, '00:00', '00:00', false); -- Sunday - closed