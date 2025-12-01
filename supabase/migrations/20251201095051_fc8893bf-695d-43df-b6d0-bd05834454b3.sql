-- Create bottles tracking table
CREATE TABLE public.bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  oil_type TEXT NOT NULL,
  quantity_ml NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  finish_date TIMESTAMPTZ,
  days_used INTEGER,
  avg_daily_consumption NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create daily logs table
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml NUMERIC NOT NULL,
  source TEXT DEFAULT 'manual', -- 'manual', 'bottle', 'scan'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date, source)
);

-- Create barcode scans table
CREATE TABLE public.barcode_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  barcode TEXT,
  oil_content_ml NUMERIC NOT NULL,
  fat_content_g NUMERIC,
  trans_fat_g NUMERIC,
  scan_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create health scores table
CREATE TABLE public.health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_oil_consumed NUMERIC NOT NULL,
  cooking_oil NUMERIC DEFAULT 0,
  bottle_oil NUMERIC DEFAULT 0,
  hidden_oil NUMERIC DEFAULT 0,
  oil_quality_score INTEGER DEFAULT 0,
  frequency_score INTEGER DEFAULT 0,
  hidden_oil_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, score_date)
);

-- Enable RLS
ALTER TABLE public.bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bottles
CREATE POLICY "Users can view their own bottles"
  ON public.bottles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bottles"
  ON public.bottles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bottles"
  ON public.bottles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bottles"
  ON public.bottles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_logs
CREATE POLICY "Users can view their own logs"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON public.daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
  ON public.daily_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
  ON public.daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for barcode_scans
CREATE POLICY "Users can view their own scans"
  ON public.barcode_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON public.barcode_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON public.barcode_scans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for health_scores
CREATE POLICY "Users can view their own scores"
  ON public.health_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
  ON public.health_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON public.health_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_bottles_user_date ON public.bottles(user_id, start_date);
CREATE INDEX idx_daily_logs_user_date ON public.daily_logs(user_id, log_date);
CREATE INDEX idx_barcode_scans_user_date ON public.barcode_scans(user_id, scan_date);
CREATE INDEX idx_health_scores_user_date ON public.health_scores(user_id, score_date);