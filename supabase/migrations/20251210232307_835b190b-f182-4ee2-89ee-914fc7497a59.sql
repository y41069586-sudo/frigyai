-- Add DELETE policy for water_intake so users can remove their records
CREATE POLICY "Users can delete their own water intake"
ON public.water_intake
FOR DELETE
USING (auth.uid() = user_id);