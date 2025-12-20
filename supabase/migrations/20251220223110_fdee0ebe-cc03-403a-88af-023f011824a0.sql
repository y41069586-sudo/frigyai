-- Add user_name column to user_onboarding table for personalized greetings
ALTER TABLE public.user_onboarding 
ADD COLUMN IF NOT EXISTS user_name TEXT;