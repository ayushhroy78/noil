-- Add city/district field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN city text;