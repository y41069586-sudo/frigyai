-- Create meal_plan_usage table for tracking weekly meal plan generation
CREATE TABLE public.meal_plan_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  generation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.meal_plan_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own meal plan usage"
ON public.meal_plan_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plan usage"
ON public.meal_plan_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plan usage"
ON public.meal_plan_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Modify scan_usage to track weekly instead of daily for free users
-- We'll add a new column week_start to track weekly scans
ALTER TABLE public.scan_usage
ADD COLUMN IF NOT EXISTS week_start DATE;