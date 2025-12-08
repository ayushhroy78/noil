-- Create milestones table
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak', 'reduction', 'challenge', 'household', 'region')),
  icon TEXT,
  points_reward INTEGER DEFAULT 0,
  threshold_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_milestones table
CREATE TABLE public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta JSONB DEFAULT '{}'::jsonb,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for milestones (public read)
CREATE POLICY "Anyone can view milestones" ON public.milestones
  FOR SELECT USING (true);

-- RLS policies for user_milestones
CREATE POLICY "Users can view their own milestones" ON public.user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones" ON public.user_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" ON public.user_milestones
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert default milestones
INSERT INTO public.milestones (code, title, description, type, icon, points_reward, threshold_value) VALUES
  ('CONSISTENCY_7_DAYS', '7-Day Streak', 'Logged oil usage for 7 consecutive days', 'streak', 'flame', 50, 7),
  ('CONSISTENCY_14_DAYS', '14-Day Streak', 'Logged oil usage for 14 consecutive days', 'streak', 'flame', 100, 14),
  ('CONSISTENCY_30_DAYS', '30-Day Champion', 'Logged oil usage for 30 consecutive days', 'streak', 'trophy', 200, 30),
  ('REDUCTION_10_PERCENT', '10% Oil Saver', 'Reduced oil consumption by 10% this month', 'reduction', 'trending-down', 75, 10),
  ('REDUCTION_25_PERCENT', '25% Oil Champion', 'Reduced oil consumption by 25% this month', 'reduction', 'trending-down', 150, 25),
  ('REDUCTION_50_PERCENT', 'Half & Healthy', 'Reduced oil consumption by 50%', 'reduction', 'award', 300, 50),
  ('CHALLENGE_ZERO_OIL', 'Zero Oil Hero', 'Completed a zero-oil cooking challenge', 'challenge', 'zap', 100, NULL),
  ('CHALLENGE_LOW_OIL_WEEK', 'Low-Oil Week', 'Stayed under 15ml/day for a week', 'challenge', 'leaf', 75, NULL),
  ('HOUSEHOLD_A_PLUS', 'Healthy Household A+', 'Achieved A+ household health grade', 'household', 'home', 200, NULL),
  ('HOUSEHOLD_IMPROVED', 'Family Progress', 'Improved household oil consumption by 20%', 'household', 'users', 100, 20),
  ('REGION_TOP_10', 'Regional Leader', 'Ranked in top 10% of your region', 'region', 'map-pin', 150, 10),
  ('REGION_TOP_25', 'Regional Champion', 'Ranked in top 25% of your region', 'region', 'map', 75, 25);

-- Create index for faster queries
CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX idx_user_milestones_achieved_at ON public.user_milestones(achieved_at DESC);