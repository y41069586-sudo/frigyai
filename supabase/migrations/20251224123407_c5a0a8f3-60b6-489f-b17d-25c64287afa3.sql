-- Create storage bucket for food photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own food photos
CREATE POLICY "Users can upload their own food photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'food-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view food photos (public bucket)
CREATE POLICY "Food photos are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'food-photos');

-- Allow users to delete their own food photos
CREATE POLICY "Users can delete their own food photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'food-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add image_url column to food_entries
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS image_url TEXT;