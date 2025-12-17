-- Create subscription cache table for instant loading
CREATE TABLE public.subscription_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  product_id TEXT,
  subscription_end TIMESTAMPTZ,
  is_trial BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_cache ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription status
CREATE POLICY "Users can view own subscription" 
ON public.subscription_cache 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role can manage subscriptions" 
ON public.subscription_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_subscription_cache_user_id ON public.subscription_cache(user_id);