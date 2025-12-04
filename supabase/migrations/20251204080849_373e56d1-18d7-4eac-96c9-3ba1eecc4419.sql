-- Add health profile columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS weight_kg numeric,
ADD COLUMN IF NOT EXISTS height_cm numeric,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS health_conditions text[];

-- Create family_members table
CREATE TABLE public.family_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  age integer,
  weight_kg numeric,
  height_cm numeric,
  gender text,
  activity_level text DEFAULT 'moderate',
  daily_oil_goal_ml numeric DEFAULT 20,
  relationship text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_members
CREATE POLICY "Users can view their own family members"
ON public.family_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members"
ON public.family_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members"
ON public.family_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members"
ON public.family_members FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();