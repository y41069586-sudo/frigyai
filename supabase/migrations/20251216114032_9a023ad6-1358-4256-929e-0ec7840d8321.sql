-- Add CHECK constraints to community_recipes for server-side validation
ALTER TABLE public.community_recipes 
  ADD CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  ADD CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 1000),
  ADD CONSTRAINT ingredients_size CHECK (array_length(ingredients, 1) >= 1 AND array_length(ingredients, 1) <= 50),
  ADD CONSTRAINT instructions_size CHECK (array_length(instructions, 1) >= 1 AND array_length(instructions, 1) <= 30),
  ADD CONSTRAINT calories_range CHECK (calories IS NULL OR (calories >= 0 AND calories <= 10000)),
  ADD CONSTRAINT protein_range CHECK (protein IS NULL OR (protein >= 0 AND protein <= 500)),
  ADD CONSTRAINT carbs_range CHECK (carbs IS NULL OR (carbs >= 0 AND carbs <= 1000)),
  ADD CONSTRAINT fat_range CHECK (fat IS NULL OR (fat >= 0 AND fat <= 500)),
  ADD CONSTRAINT prep_time_range CHECK (prep_time IS NULL OR (prep_time >= 0 AND prep_time <= 600));