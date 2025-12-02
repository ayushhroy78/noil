-- Fix 1: Create anonymized leaderboard function to avoid exposing user_ids
CREATE OR REPLACE FUNCTION public.get_anonymized_leaderboard()
RETURNS TABLE (
  rank bigint,
  display_name text,
  total_points integer,
  points_this_week integer,
  points_this_month integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
    'Player ' || SUBSTR(user_id::text, 1, 4) as display_name,
    total_points,
    points_this_week,
    points_this_month
  FROM public.user_points
  ORDER BY total_points DESC
  LIMIT 100;
$$;

-- Fix 2: Add INSERT policy for order_items
CREATE POLICY "Users can insert their own order items" 
ON public.order_items 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

-- Create rewards store table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'premium_feature', 'wellness_content')),
  reward_value TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user redeemed rewards table
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redemption_code TEXT,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for rewards (public read)
CREATE POLICY "Anyone can view active rewards" 
ON public.rewards 
FOR SELECT 
USING (is_active = true);

-- RLS policies for user_rewards
CREATE POLICY "Users can view their own rewards" 
ON public.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards" 
ON public.user_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" 
ON public.user_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert sample rewards
INSERT INTO public.rewards (name, description, points_cost, reward_type, reward_value, is_active, stock_quantity) VALUES
('10% Off OilHub', 'Get 10% discount on your next OilHub purchase', 500, 'discount', '10', true, 100),
('20% Off OilHub', 'Get 20% discount on your next OilHub purchase', 900, 'discount', '20', true, 50),
('Premium Recipe Pack', 'Unlock 10 exclusive low-oil recipes from top chefs', 750, 'wellness_content', 'premium_recipes', true, NULL),
('Advanced Analytics', 'Unlock detailed health score breakdown and predictions', 1000, 'premium_feature', 'advanced_analytics', true, NULL),
('Free Delivery', 'Get free delivery on your next order', 300, 'discount', 'free_delivery', true, 200),
('Wellness Guide eBook', 'Complete guide to healthy cooking with minimal oil', 600, 'wellness_content', 'wellness_ebook', true, NULL);