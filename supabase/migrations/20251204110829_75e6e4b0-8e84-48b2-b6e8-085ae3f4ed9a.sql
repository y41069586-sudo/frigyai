-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table to track daily scan usage
CREATE TABLE public.scan_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scan_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, scan_date)
);

-- Enable RLS
ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own scan usage
CREATE POLICY "Users can view own scan usage"
ON public.scan_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own scan usage
CREATE POLICY "Users can insert own scan usage"
ON public.scan_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own scan usage
CREATE POLICY "Users can update own scan usage"
ON public.scan_usage
FOR UPDATE
USING (auth.uid() = user_id);