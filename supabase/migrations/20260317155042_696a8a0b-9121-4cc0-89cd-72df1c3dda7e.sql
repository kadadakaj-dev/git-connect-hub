
-- Create push_subscriptions table for Web Push
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL UNIQUE,
  keys text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage their own subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions; CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions; CREATE POLICY "Users can insert their own push subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions; CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Allow upsert (update endpoint keys)
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions; CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Service role full access (for edge functions cleanup)
DROP POLICY IF EXISTS "Service role full access to push subscriptions" ON public.push_subscriptions; CREATE POLICY "Service role full access to push subscriptions" ON public.push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Create booking_reminders table with per-channel dedup
CREATE TABLE public.booking_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'email',
  reminder_sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reminder_type)
);

ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

-- Only service role can manage reminders (edge functions)
DROP POLICY IF EXISTS "Service role can manage booking reminders" ON public.booking_reminders; CREATE POLICY "Service role can manage booking reminders" ON public.booking_reminders FOR ALL
  USING (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX idx_booking_reminders_booking_type ON public.booking_reminders (booking_id, reminder_type);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions (user_id);

