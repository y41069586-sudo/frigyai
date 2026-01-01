-- Persist weekly meal plans per user
CREATE TABLE IF NOT EXISTS public.weekly_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'weekly_meal_plans' AND policyname = 'Users can view their own weekly meal plan'
  ) THEN
    CREATE POLICY "Users can view their own weekly meal plan"
    ON public.weekly_meal_plans
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'weekly_meal_plans' AND policyname = 'Users can insert their own weekly meal plan'
  ) THEN
    CREATE POLICY "Users can insert their own weekly meal plan"
    ON public.weekly_meal_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'weekly_meal_plans' AND policyname = 'Users can update their own weekly meal plan'
  ) THEN
    CREATE POLICY "Users can update their own weekly meal plan"
    ON public.weekly_meal_plans
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'weekly_meal_plans' AND policyname = 'Users can delete their own weekly meal plan'
  ) THEN
    CREATE POLICY "Users can delete their own weekly meal plan"
    ON public.weekly_meal_plans
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_weekly_meal_plans_updated_at ON public.weekly_meal_plans;
CREATE TRIGGER update_weekly_meal_plans_updated_at
BEFORE UPDATE ON public.weekly_meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
