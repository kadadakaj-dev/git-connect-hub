-- Fix missing columns referenced by app code
-- 1. Add gender & category to services (used by booking flow and seed data)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unisex';
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Všeobecné';
-- 2. Add guest booking columns (customer info without requiring login)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_phone text;
-- 3. Make user_id nullable so guests can book without an account
ALTER TABLE public.bookings
ALTER COLUMN user_id DROP NOT NULL;
-- 4. Allow anonymous/guest inserts on bookings
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE policyname = 'bookings_anon_insert'
    AND tablename = 'bookings'
) THEN CREATE POLICY "bookings_anon_insert" ON public.bookings FOR
INSERT WITH CHECK (true);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE policyname = 'bookings_anon_select'
    AND tablename = 'bookings'
) THEN CREATE POLICY "bookings_anon_select" ON public.bookings FOR
SELECT USING (true);
END IF;
END $$;
-- 5. Index on new columns for query performance
CREATE INDEX IF NOT EXISTS idx_services_gender ON public.services(gender);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);