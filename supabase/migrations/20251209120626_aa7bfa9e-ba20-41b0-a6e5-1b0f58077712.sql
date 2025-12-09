-- =====================================================
-- SCALABILITY MIGRATION: Indexes & Aggregated Tables
-- For 5 lakh+ users optimization
-- =====================================================

-- 1. TRACKING INDEXES
-- -------------------

-- daily_logs: user + date lookup (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date 
ON public.daily_logs (user_id, log_date DESC);

-- barcode_scans: user + scan date
CREATE INDEX IF NOT EXISTS idx_barcode_scans_user_date 
ON public.barcode_scans (user_id, scan_date DESC);

-- bottles: user + date range
CREATE INDEX IF NOT EXISTS idx_bottles_user_dates 
ON public.bottles (user_id, start_date, finish_date);

-- bottles: partial index for active bottles (no finish date)
CREATE INDEX IF NOT EXISTS idx_bottles_active 
ON public.bottles (user_id) WHERE finish_date IS NULL;

-- 2. REWARDS INDEXES
-- ------------------

-- user_points: ensure unique user lookup is fast
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_points_user 
ON public.user_points (user_id);

-- point_transactions: user activity history
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_date 
ON public.point_transactions (user_id, created_at DESC);

-- point_transactions: by source type for analytics
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_source 
ON public.point_transactions (user_id, source, created_at DESC);

-- user_achievements: user lookup
CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
ON public.user_achievements (user_id);

-- 3. PRODUCT/ORDER INDEXES
-- ------------------------

-- products: by type (category equivalent)
CREATE INDEX IF NOT EXISTS idx_products_type 
ON public.products (product_type);

-- product_variants: by product
CREATE INDEX IF NOT EXISTS idx_product_variants_product 
ON public.product_variants (product_id);

-- orders: user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_date 
ON public.orders (user_id, created_at DESC);

-- order_items: by order
CREATE INDEX IF NOT EXISTS idx_order_items_order 
ON public.order_items (order_id);

-- cart_items: user cart
CREATE INDEX IF NOT EXISTS idx_cart_items_user 
ON public.cart_items (user_id);

-- 4. RESTAURANT INDEXES
-- ---------------------

-- restaurant_applications: status filtering for admin
CREATE INDEX IF NOT EXISTS idx_restaurant_apps_status_date 
ON public.restaurant_applications (status, created_at DESC);

-- restaurant_applications: by certification status
CREATE INDEX IF NOT EXISTS idx_restaurant_apps_certified 
ON public.restaurant_applications (blockchain_certified) WHERE blockchain_certified = true;

-- restaurant_applications: by state for regional filtering
CREATE INDEX IF NOT EXISTS idx_restaurant_apps_state 
ON public.restaurant_applications (state, blockchain_certified);

-- 5. AI/CHAT INDEXES
-- ------------------

-- chat_messages: user conversation history
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date 
ON public.chat_messages (user_id, created_at DESC);

-- consumption_audits: user audit history
CREATE INDEX IF NOT EXISTS idx_consumption_audits_user_date 
ON public.consumption_audits (user_id, created_at DESC);

-- 6. COMMUNITY INDEXES
-- --------------------

-- community_posts: for feed queries
CREATE INDEX IF NOT EXISTS idx_community_posts_date 
ON public.community_posts (created_at DESC) WHERE is_deleted = false AND is_hidden = false;

-- community_posts: by user
CREATE INDEX IF NOT EXISTS idx_community_posts_user 
ON public.community_posts (user_id, created_at DESC);

-- community_comments: by post
CREATE INDEX IF NOT EXISTS idx_community_comments_post 
ON public.community_comments (post_id, created_at DESC) WHERE is_deleted = false;

-- community_votes: by post for counting
CREATE INDEX IF NOT EXISTS idx_community_votes_post 
ON public.community_votes (post_id);

-- 7. CHALLENGE INDEXES
-- --------------------

-- user_challenges: user lookup
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status 
ON public.user_challenges (user_id, status);

-- challenge_check_ins: user + date
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_user_date 
ON public.challenge_check_ins (user_id, check_in_date DESC);

-- challenge_streaks: user lookup
CREATE INDEX IF NOT EXISTS idx_challenge_streaks_user 
ON public.challenge_streaks (user_id);

-- 8. HEALTH SCORES INDEX
-- ----------------------

CREATE INDEX IF NOT EXISTS idx_health_scores_user_date 
ON public.health_scores (user_id, score_date DESC);

-- 9. USER PROFILES INDEX
-- ----------------------

CREATE INDEX IF NOT EXISTS idx_user_profiles_state 
ON public.user_profiles (state);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user 
ON public.user_profiles (user_id);

-- 10. HABIT INTEGRITY INDEX
-- -------------------------

CREATE INDEX IF NOT EXISTS idx_habit_integrity_user 
ON public.habit_integrity (user_id);

-- =====================================================
-- AGGREGATED TABLES FOR FAST READS
-- =====================================================

-- User Daily Aggregates - pre-computed daily totals
CREATE TABLE IF NOT EXISTS public.user_daily_aggregates (
  user_id uuid NOT NULL,
  date date NOT NULL,
  total_oil_ml numeric NOT NULL DEFAULT 0,
  cooking_oil_ml numeric NOT NULL DEFAULT 0,
  bottle_oil_ml numeric NOT NULL DEFAULT 0,
  hidden_oil_ml numeric NOT NULL DEFAULT 0,
  trans_fat_g numeric NOT NULL DEFAULT 0,
  scan_count integer NOT NULL DEFAULT 0,
  log_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_daily_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_daily_aggregates
CREATE POLICY "Users can view their own aggregates"
ON public.user_daily_aggregates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own aggregates"
ON public.user_daily_aggregates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aggregates"
ON public.user_daily_aggregates FOR UPDATE
USING (auth.uid() = user_id);

-- Index for fast user+date range queries
CREATE INDEX IF NOT EXISTS idx_user_daily_aggregates_user_date
ON public.user_daily_aggregates (user_id, date DESC);

-- =====================================================
-- ARCHIVE TABLES FOR DATA RETENTION
-- =====================================================

-- Daily logs archive
CREATE TABLE IF NOT EXISTS public.daily_logs_archive (
  LIKE public.daily_logs INCLUDING ALL,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Barcode scans archive
CREATE TABLE IF NOT EXISTS public.barcode_scans_archive (
  LIKE public.barcode_scans INCLUDING ALL,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chat messages archive
CREATE TABLE IF NOT EXISTS public.chat_messages_archive (
  LIKE public.chat_messages INCLUDING ALL,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Point transactions archive
CREATE TABLE IF NOT EXISTS public.point_transactions_archive (
  LIKE public.point_transactions INCLUDING ALL,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- TRIGGER FUNCTION: Update aggregates on daily_logs change
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_daily_aggregates_on_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
  v_user_id uuid;
BEGIN
  -- Determine the affected user and date
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_date := OLD.log_date;
  ELSE
    v_user_id := NEW.user_id;
    v_date := NEW.log_date;
  END IF;

  -- Recalculate aggregates for this user+date
  INSERT INTO public.user_daily_aggregates (user_id, date, total_oil_ml, cooking_oil_ml, log_count, updated_at)
  SELECT 
    v_user_id,
    v_date,
    COALESCE(SUM(amount_ml), 0),
    COALESCE(SUM(CASE WHEN source = 'cooking' OR source = 'manual' THEN amount_ml ELSE 0 END), 0),
    COUNT(*),
    now()
  FROM public.daily_logs
  WHERE user_id = v_user_id AND log_date = v_date
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_oil_ml = EXCLUDED.total_oil_ml,
    cooking_oil_ml = EXCLUDED.cooking_oil_ml,
    log_count = EXCLUDED.log_count,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on daily_logs
DROP TRIGGER IF EXISTS trg_update_aggregates_on_log ON public.daily_logs;
CREATE TRIGGER trg_update_aggregates_on_log
AFTER INSERT OR UPDATE OR DELETE ON public.daily_logs
FOR EACH ROW EXECUTE FUNCTION public.update_daily_aggregates_on_log();

-- =====================================================
-- TRIGGER FUNCTION: Update aggregates on barcode_scans change
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_daily_aggregates_on_scan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
  v_user_id uuid;
BEGIN
  -- Determine the affected user and date
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_date := OLD.scan_date::date;
  ELSE
    v_user_id := NEW.user_id;
    v_date := NEW.scan_date::date;
  END IF;

  -- Recalculate scan aggregates for this user+date
  INSERT INTO public.user_daily_aggregates (user_id, date, hidden_oil_ml, trans_fat_g, scan_count, updated_at)
  SELECT 
    v_user_id,
    v_date,
    COALESCE(SUM(oil_content_ml), 0),
    COALESCE(SUM(trans_fat_g), 0),
    COUNT(*),
    now()
  FROM public.barcode_scans
  WHERE user_id = v_user_id AND scan_date::date = v_date
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    hidden_oil_ml = EXCLUDED.hidden_oil_ml,
    trans_fat_g = EXCLUDED.trans_fat_g,
    scan_count = EXCLUDED.scan_count,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on barcode_scans
DROP TRIGGER IF EXISTS trg_update_aggregates_on_scan ON public.barcode_scans;
CREATE TRIGGER trg_update_aggregates_on_scan
AFTER INSERT OR UPDATE OR DELETE ON public.barcode_scans
FOR EACH ROW EXECUTE FUNCTION public.update_daily_aggregates_on_scan();