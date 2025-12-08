-- Add image_url column to community_posts
ALTER TABLE public.community_posts 
ADD COLUMN image_url TEXT;