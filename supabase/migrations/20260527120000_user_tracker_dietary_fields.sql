-- Persist onboarding dietary goals for cross-device meal plans
ALTER TABLE public.user_tracker_settings
  ADD COLUMN IF NOT EXISTS dietary_preferences text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS health_goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergies_other text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.user_tracker_settings.dietary_preferences IS 'Onboarding dietary goal ids: balanced, vegan, keto, etc.';
COMMENT ON COLUMN public.user_tracker_settings.health_goals IS 'Onboarding health goal ids: fitness, energy, etc.';
COMMENT ON COLUMN public.user_tracker_settings.allergies IS 'Allergy ids from onboarding';
COMMENT ON COLUMN public.user_tracker_settings.allergies_other IS 'Free-text allergy / intolerance';
