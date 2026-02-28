-- Restore service role access to subscription_cache for edge functions
CREATE POLICY "Service role can manage subscriptions" 
ON public.subscription_cache 
FOR ALL 
USING (true)
WITH CHECK (true);
