-- Create table for daily challenge check-ins
CREATE TABLE public.challenge_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Meal details
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  oil_type TEXT,
  oil_quantity_ml NUMERIC,
  cooking_method TEXT,
  
  -- Photo verification
  photo_url TEXT,
  photo_uploaded_at TIMESTAMP WITH TIME ZONE,
  photo_exif_date TIMESTAMP WITH TIME ZONE,
  
  -- Progressive questions responses
  ingredients_used TEXT[],
  alternative_ingredients TEXT[],
  cooking_notes TEXT,
  
  -- Health tracking (optional)
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'tired', 'stressed')),
  cravings_notes TEXT,
  
  -- Anti-cheat flags
  is_verified BOOLEAN DEFAULT false,
  verification_score INTEGER DEFAULT 0,
  flagged_suspicious BOOLEAN DEFAULT false,
  flag_reason TEXT,
  
  -- Prevent backdating
  entry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, user_challenge_id, check_in_date, meal_type)
);

-- Create table for daily prompts
CREATE TABLE public.challenge_daily_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  prompt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prompt_text TEXT NOT NULL,
  expected_detail TEXT,
  user_response TEXT,
  response_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, user_challenge_id, prompt_date)
);

-- Create table for streak tracking
CREATE TABLE public.challenge_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_check_in_date DATE,
  streak_start_date DATE,
  total_check_ins INTEGER DEFAULT 0,
  missed_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, user_challenge_id)
);

-- Enable RLS
ALTER TABLE public.challenge_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_daily_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenge_check_ins
CREATE POLICY "Users can view their own check-ins" ON public.challenge_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins" ON public.challenge_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins" ON public.challenge_check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for challenge_daily_prompts
CREATE POLICY "Users can view their own prompts" ON public.challenge_daily_prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts" ON public.challenge_daily_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" ON public.challenge_daily_prompts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for challenge_streaks
CREATE POLICY "Users can view their own streaks" ON public.challenge_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON public.challenge_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON public.challenge_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);

-- Storage policies for meal photos
CREATE POLICY "Users can upload their own meal photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own meal photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view meal photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-photos');

CREATE POLICY "Users can delete their own meal photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updating streak timestamps
CREATE TRIGGER update_challenge_streaks_updated_at
  BEFORE UPDATE ON public.challenge_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();