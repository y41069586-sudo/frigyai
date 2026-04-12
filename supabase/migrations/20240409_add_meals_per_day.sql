-- Add meals_per_day column to user_tracker_settings
ALTER TABLE user_tracker_settings 
ADD COLUMN meals_per_day INTEGER NOT NULL DEFAULT 5;

-- Add comment for clarity
COMMENT ON COLUMN user_tracker_settings.meals_per_day IS 'Number of meals per day for meal plan generation (typically 3-6)';
