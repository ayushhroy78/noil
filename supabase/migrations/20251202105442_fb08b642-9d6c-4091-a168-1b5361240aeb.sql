-- Create achievements/badges table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  badge_tier TEXT NOT NULL CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_reward INTEGER NOT NULL DEFAULT 0,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create user points table
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  points_this_week INTEGER NOT NULL DEFAULT 0,
  points_this_month INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points"
ON public.user_points
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
ON public.user_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
ON public.user_points
FOR UPDATE
USING (auth.uid() = user_id);

-- Leaderboard policy (users can view all points for leaderboard)
CREATE POLICY "Users can view all points for leaderboard"
ON public.user_points
FOR SELECT
USING (true);

-- Insert sample achievements
INSERT INTO public.achievements (title, description, icon, badge_tier, points_reward, milestone_type, milestone_value) VALUES
('First Steps', 'Complete your first challenge', '🎯', 'bronze', 50, 'challenges_completed', 1),
('Challenge Master', 'Complete 5 challenges', '🏆', 'silver', 150, 'challenges_completed', 5),
('Challenge Champion', 'Complete 10 challenges', '👑', 'gold', 300, 'challenges_completed', 10),
('Quiz Novice', 'Complete your first quiz', '📝', 'bronze', 30, 'quizzes_completed', 1),
('Quiz Expert', 'Complete 5 quizzes', '🎓', 'silver', 100, 'quizzes_completed', 5),
('Perfect Score', 'Get a perfect score on any quiz', '⭐', 'gold', 200, 'perfect_quiz_scores', 1),
('Health Hero', 'Maintain Health Score above 80 for 7 days', '💚', 'gold', 250, 'health_score_streak', 7),
('Oil Tracker', 'Log oil consumption for 7 consecutive days', '📊', 'silver', 120, 'tracking_streak', 7),
('Recipe Explorer', 'Try 5 Fit Meal recipes', '🍳', 'silver', 100, 'recipes_tried', 5),
('Consistency King', 'Use the app for 30 consecutive days', '🔥', 'platinum', 500, 'login_streak', 30);

-- Create trigger for updated_at on user_points
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();