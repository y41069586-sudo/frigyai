-- Create table for storing user onboarding progress
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  selected_source TEXT,
  selected_goal TEXT,
  selected_cooking TEXT,
  selected_challenge TEXT,
  health_sync_choice TEXT,
  community_joined BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding data
CREATE POLICY "Users can view own onboarding" 
ON public.user_onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own onboarding data
CREATE POLICY "Users can insert own onboarding" 
ON public.user_onboarding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding data
CREATE POLICY "Users can update own onboarding" 
ON public.user_onboarding 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();