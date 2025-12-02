-- Create restaurant applications table
CREATE TABLE public.restaurant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  restaurant_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  description TEXT,
  menu_items JSONB NOT NULL DEFAULT '[]',
  oil_types TEXT[] NOT NULL DEFAULT '{}',
  cooking_methods TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create approved restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.restaurant_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  menu_items JSONB NOT NULL DEFAULT '[]',
  oil_types TEXT[] NOT NULL DEFAULT '{}',
  cooking_methods TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reward activity log table
CREATE TABLE public.reward_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('daily_log', 'challenge_complete', 'quiz_complete', 'referral', 'streak_bonus', 'badge_unlock')),
  points_earned INTEGER NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add role column to user_profiles if not exists
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'restaurant_owner'));

-- Add display_name to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Enable RLS on new tables
ALTER TABLE public.restaurant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS for restaurant_applications
CREATE POLICY "Users can view their own applications"
ON public.restaurant_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
ON public.restaurant_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
ON public.restaurant_applications
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_profiles.user_id = auth.uid() 
  AND user_profiles.role = 'admin'
));

CREATE POLICY "Admins can update any application"
ON public.restaurant_applications
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_profiles.user_id = auth.uid() 
  AND user_profiles.role = 'admin'
));

-- RLS for restaurants (public read)
CREATE POLICY "Anyone can view active restaurants"
ON public.restaurants
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage restaurants"
ON public.restaurants
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_profiles.user_id = auth.uid() 
  AND user_profiles.role = 'admin'
));

-- RLS for reward_activity_log
CREATE POLICY "Users can view their own activity log"
ON public.reward_activity_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity log"
ON public.reward_activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_restaurant_applications_status ON public.restaurant_applications(status);
CREATE INDEX idx_restaurant_applications_user ON public.restaurant_applications(user_id);
CREATE INDEX idx_restaurants_city ON public.restaurants(city);
CREATE INDEX idx_reward_activity_log_user ON public.reward_activity_log(user_id);
CREATE INDEX idx_reward_activity_log_type ON public.reward_activity_log(activity_type);

-- Create trigger for updated_at on restaurant_applications
CREATE TRIGGER update_restaurant_applications_updated_at
BEFORE UPDATE ON public.restaurant_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on restaurants
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
