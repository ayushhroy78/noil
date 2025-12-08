-- Add household_size to user_profiles if not present
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS household_size integer DEFAULT 1;

-- Create habit_integrity table for storing habit stability metrics
CREATE TABLE public.habit_integrity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  habit_stability_score integer NOT NULL DEFAULT 50,
  honesty_level text NOT NULL DEFAULT 'medium' CHECK (honesty_level IN ('high', 'medium', 'low')),
  reward_multiplier numeric NOT NULL DEFAULT 1.0,
  flags jsonb DEFAULT '[]'::jsonb,
  feature_vector jsonb DEFAULT '{}'::jsonb,
  signals jsonb DEFAULT '{}'::jsonb,
  last_computed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habit_integrity ENABLE ROW LEVEL SECURITY;

-- Users can view their own integrity data
CREATE POLICY "Users can view their own habit integrity"
ON public.habit_integrity
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own integrity data
CREATE POLICY "Users can insert their own habit integrity"
ON public.habit_integrity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrity data
CREATE POLICY "Users can update their own habit integrity"
ON public.habit_integrity
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_habit_integrity_user_id ON public.habit_integrity(user_id);
CREATE INDEX idx_habit_integrity_honesty_level ON public.habit_integrity(honesty_level);

-- Create trigger for updated_at
CREATE TRIGGER update_habit_integrity_updated_at
BEFORE UPDATE ON public.habit_integrity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();