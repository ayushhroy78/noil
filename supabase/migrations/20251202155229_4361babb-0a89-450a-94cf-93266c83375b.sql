-- Create referrals table to track referral relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_rewarded BOOLEAN DEFAULT false,
  referred_rewarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add referral_code column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID;

-- Create function to generate unique referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTR(MD5(NEW.user_id::text || NOW()::text), 1, 8));
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate referral code
CREATE TRIGGER generate_user_referral_code
BEFORE INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they were referred"
ON public.referrals
FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals for themselves"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- Update existing user_profiles to have referral codes
UPDATE public.user_profiles 
SET referral_code = UPPER(SUBSTR(MD5(user_id::text || created_at::text), 1, 8))
WHERE referral_code IS NULL;