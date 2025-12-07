-- Create point_transactions table to track all point activities
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned' or 'spent'
  source TEXT NOT NULL, -- 'challenge', 'quiz', 'referral', 'streak', 'achievement', 'reward_redemption', 'daily_login', 'milestone'
  source_id UUID, -- optional reference to the source (challenge_id, quiz_id, etc.)
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions"
  ON public.point_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.point_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX idx_point_transactions_created_at ON public.point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_source ON public.point_transactions(source);

-- Add lifetime_points_earned and lifetime_points_spent to user_points table
ALTER TABLE public.user_points 
  ADD COLUMN IF NOT EXISTS lifetime_points_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_points_spent INTEGER NOT NULL DEFAULT 0;