-- Atomic increment for meal plan usage (avoids read-modify-write races)
CREATE OR REPLACE FUNCTION public.increment_meal_plan_usage(p_user_id UUID, p_week_start DATE)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.meal_plan_usage (user_id, week_start, generation_count, updated_at)
  VALUES (p_user_id, p_week_start, 1, now())
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    generation_count = meal_plan_usage.generation_count + 1,
    updated_at = now();
$$;

GRANT EXECUTE ON FUNCTION public.increment_meal_plan_usage(UUID, DATE) TO service_role;
