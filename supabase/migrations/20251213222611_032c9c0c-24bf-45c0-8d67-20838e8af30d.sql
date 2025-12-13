-- Create user_tracker_settings table to persist tracker data
CREATE TABLE public.user_tracker_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  age INTEGER,
  weight NUMERIC,
  target_weight NUMERIC,
  goal_mode TEXT DEFAULT 'lose', -- 'lose' or 'gain'
  weekly_goal NUMERIC DEFAULT 0.5,
  daily_calories INTEGER,
  daily_protein INTEGER,
  daily_carbs INTEGER,
  daily_fat INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_tracker_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own tracker settings" 
ON public.user_tracker_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracker settings" 
ON public.user_tracker_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracker settings" 
ON public.user_tracker_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracker settings" 
ON public.user_tracker_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_tracker_settings_updated_at
BEFORE UPDATE ON public.user_tracker_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();