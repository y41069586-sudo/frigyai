-- Add UPDATE policy for weight_entries so users can correct mistakes
CREATE POLICY "Users can update their own weight entries"
ON public.weight_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);