-- Create table for storing AI consumption audit history
CREATE TABLE public.consumption_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  audit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_risk TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  health_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  consumption_trend TEXT NOT NULL,
  weekly_analysis TEXT,
  daily_consumption NUMERIC,
  weekly_consumption NUMERIC,
  monthly_consumption NUMERIC,
  health_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.consumption_audits ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own audits" 
ON public.consumption_audits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audits" 
ON public.consumption_audits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audits" 
ON public.consumption_audits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_consumption_audits_user_date ON public.consumption_audits(user_id, audit_date DESC);