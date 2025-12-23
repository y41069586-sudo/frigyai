-- Create table for storing eaten meals (food log entries)
CREATE TABLE public.food_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(10,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(10,2) NOT NULL DEFAULT 0,
  fat NUMERIC(10,2) NOT NULL DEFAULT 0,
  portion TEXT,
  meal_type TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack'
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own food entries" 
ON public.food_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food entries" 
ON public.food_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food entries" 
ON public.food_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food entries" 
ON public.food_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_food_entries_updated_at
BEFORE UPDATE ON public.food_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries by user and date
CREATE INDEX idx_food_entries_user_date ON public.food_entries(user_id, date);

-- Enable realtime for food entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_entries;