-- Push notification subscriptions table
-- Used by the PWA push notification system to store Web Push subscriptions
-- linked to authenticated users or anonymous endpoints.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL UNIQUE,
  keys jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- RLS policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
DROP POLICY IF EXISTS "Users can insert own push subscription" ON public.push_subscriptions; CREATE POLICY "Users can insert own push subscription" ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions; CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions; CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions; CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (edge functions) can access all subscriptions for sending push
-- This is handled by Supabase's service_role key bypassing RLS.

