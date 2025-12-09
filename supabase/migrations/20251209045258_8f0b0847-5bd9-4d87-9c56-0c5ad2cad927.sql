-- Create challenge_tokens table for anti-cheat verification
CREATE TABLE public.challenge_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index to ensure only one active token per user/challenge at a time
CREATE UNIQUE INDEX unique_active_token_per_user_challenge 
ON public.challenge_tokens (user_id, challenge_id) 
WHERE status = 'active';

-- Create index for efficient lookups
CREATE INDEX idx_challenge_tokens_lookup 
ON public.challenge_tokens (user_id, challenge_id, status, expires_at);

-- Enable Row Level Security
ALTER TABLE public.challenge_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own tokens
CREATE POLICY "Users can view their own tokens" 
ON public.challenge_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own tokens (via edge function)
CREATE POLICY "Users can insert their own tokens" 
ON public.challenge_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens (to mark as used)
CREATE POLICY "Users can update their own tokens" 
ON public.challenge_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can view all tokens
CREATE POLICY "Admins can view all tokens" 
ON public.challenge_tokens 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Function to expire old tokens (can be called by cron)
CREATE OR REPLACE FUNCTION public.expire_old_challenge_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.challenge_tokens
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at < now();
END;
$$;