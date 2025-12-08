-- Create community_profiles table
CREATE TABLE public.community_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community_follows table for follow relationships
CREATE TABLE public.community_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_profiles
CREATE POLICY "Anyone can view community profiles"
ON public.community_profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.community_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.community_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for community_follows
CREATE POLICY "Anyone can view follows"
ON public.community_follows
FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.community_follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.community_follows
FOR DELETE
USING (auth.uid() = follower_id);

-- Create trigger for updated_at
CREATE TRIGGER update_community_profiles_updated_at
BEFORE UPDATE ON public.community_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for community profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-profiles', 'community-profiles', true);

-- Storage policies
CREATE POLICY "Anyone can view community profile images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-profiles');

CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'community-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'community-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'community-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);