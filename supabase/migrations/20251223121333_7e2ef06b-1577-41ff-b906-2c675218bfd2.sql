-- Add average_rating and rating_count to community_recipes for caching
ALTER TABLE public.community_recipes 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create function to update recipe rating stats
CREATE OR REPLACE FUNCTION public.update_recipe_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the average rating and count on the recipe
  UPDATE public.community_recipes
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-update recipe stats when ratings change
DROP TRIGGER IF EXISTS trigger_update_recipe_rating ON public.recipe_ratings;
CREATE TRIGGER trigger_update_recipe_rating
AFTER INSERT OR UPDATE OR DELETE ON public.recipe_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_recipe_rating_stats();

-- Create table for user likes on recipes
CREATE TABLE IF NOT EXISTS public.recipe_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.community_recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for recipe_likes
CREATE POLICY "Anyone can view likes count" 
ON public.recipe_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like recipes" 
ON public.recipe_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON public.recipe_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add likes_count to community_recipes
ALTER TABLE public.community_recipes 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_recipes
  SET 
    likes_count = (
      SELECT COUNT(*)
      FROM public.recipe_likes
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for likes count
DROP TRIGGER IF EXISTS trigger_update_recipe_likes ON public.recipe_likes;
CREATE TRIGGER trigger_update_recipe_likes
AFTER INSERT OR DELETE ON public.recipe_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_recipe_likes_count();