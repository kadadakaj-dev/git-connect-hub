-- Create client profiles table
CREATE TABLE public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'sk',
  total_visits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create therapist notes table (for completed bookings)
CREATE TABLE public.therapist_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create favorite services table
CREATE TABLE public.favorite_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(client_id, service_id)
);

-- Create email reminders table to track sent reminders
CREATE TABLE public.booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_type TEXT DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add client_user_id to bookings to link authenticated users
ALTER TABLE public.bookings 
ADD COLUMN client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.client_profiles; CREATE POLICY "Users can view their own profile" ON public.client_profiles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.client_profiles; CREATE POLICY "Users can update their own profile" ON public.client_profiles FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.client_profiles; CREATE POLICY "Users can insert their own profile" ON public.client_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.client_profiles; CREATE POLICY "Admins can view all profiles" ON public.client_profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.client_profiles; CREATE POLICY "Admins can manage all profiles" ON public.client_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for therapist_notes (only admins)
DROP POLICY IF EXISTS "Admins can manage therapist notes" ON public.therapist_notes; CREATE POLICY "Admins can manage therapist notes" ON public.therapist_notes FOR ALL
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Clients can view notes on their bookings" ON public.therapist_notes; CREATE POLICY "Clients can view notes on their bookings" ON public.therapist_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND b.client_user_id = auth.uid()
  )
);

-- RLS Policies for favorite_services
DROP POLICY IF EXISTS "Users can manage their favorites" ON public.favorite_services; CREATE POLICY "Users can manage their favorites" ON public.favorite_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.client_profiles cp
    WHERE cp.id = client_id AND cp.user_id = auth.uid()
  )
);

-- RLS Policies for booking_reminders
DROP POLICY IF EXISTS "Admins can manage reminders" ON public.booking_reminders; CREATE POLICY "Admins can manage reminders" ON public.booking_reminders FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Update bookings RLS to allow clients to view their own bookings
DROP POLICY IF EXISTS "Clients can view their own bookings" ON public.bookings; CREATE POLICY "Clients can view their own bookings" ON public.bookings FOR SELECT
USING (client_user_id = auth.uid());

-- Create trigger for updating client_profiles.updated_at
CREATE TRIGGER update_client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating therapist_notes.updated_at
CREATE TRIGGER update_therapist_notes_updated_at
BEFORE UPDATE ON public.therapist_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment visit count
CREATE OR REPLACE FUNCTION public.increment_client_visits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.client_profiles
    SET total_visits = total_visits + 1
    WHERE user_id = NEW.client_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-increment visits
CREATE TRIGGER increment_visits_on_completion
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.increment_client_visits();
