-- Drop the insecure policy that grants public ALL access to subscription_cache
-- Edge Functions using SUPABASE_SERVICE_ROLE_KEY bypass RLS automatically, so no replacement needed
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscription_cache;