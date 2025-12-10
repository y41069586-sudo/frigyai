-- Add DELETE policy for scan_usage so users can remove their scan history
CREATE POLICY "Users can delete their own scan usage"
ON public.scan_usage
FOR DELETE
USING (auth.uid() = user_id);