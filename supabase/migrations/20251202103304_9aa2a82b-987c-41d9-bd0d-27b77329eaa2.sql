-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 0,
  challenge_type TEXT NOT NULL, -- 'oil_reduction', 'cooking_method', 'recipe_based'
  target_metric TEXT, -- e.g., 'reduce_oil_10_percent', 'no_deep_fry'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_challenges table for tracking progress
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_data JSONB DEFAULT '{}', -- stores daily progress
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'oil_basics', 'nutrition', 'cooking_methods'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  reward_points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- array of option strings
  correct_answer INTEGER NOT NULL, -- index of correct option
  explanation TEXT,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL, -- stores user answers
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_content table
CREATE TABLE public.health_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'did_you_know', 'myths_facts', 'hidden_oil', 'cooking_tips', 'health_risks'
  preview TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nudge_templates table
CREATE TABLE public.nudge_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_text TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'health_score_drop', 'high_hidden_oil', 'low_oil_week', etc.
  priority INTEGER DEFAULT 1,
  icon TEXT, -- lucide icon name
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read)
CREATE POLICY "Anyone can view challenges"
  ON public.challenges FOR SELECT
  USING (true);

-- RLS Policies for user_challenges
CREATE POLICY "Users can view their own challenge progress"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress"
  ON public.user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for quizzes (public read)
CREATE POLICY "Anyone can view quizzes"
  ON public.quizzes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (true);

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for health_content (public read)
CREATE POLICY "Anyone can view health content"
  ON public.health_content FOR SELECT
  USING (true);

-- RLS Policies for nudge_templates (public read)
CREATE POLICY "Anyone can view nudge templates"
  ON public.nudge_templates FOR SELECT
  USING (true);

-- Insert sample challenges
INSERT INTO public.challenges (title, description, duration_days, reward_points, challenge_type, target_metric) VALUES
  ('10% Less Oil This Week', 'Reduce your daily oil consumption by 10% compared to last week', 7, 50, 'oil_reduction', 'reduce_oil_10_percent'),
  ('No Deep-Frying Challenge', 'Avoid deep-fried foods for 3 consecutive days', 3, 30, 'cooking_method', 'no_deep_fry'),
  ('Fit Meal Champion', 'Cook 2 recipes from Fit Meal this week', 7, 40, 'recipe_based', 'cook_fit_meals'),
  ('Healthy Oil Swap', 'Use only cold-pressed oils for 5 days', 5, 35, 'oil_quality', 'cold_pressed_only');

-- Insert sample quiz
INSERT INTO public.quizzes (title, description, category, difficulty, reward_points) VALUES
  ('Oil Basics 101', 'Test your knowledge about cooking oils and health', 'oil_basics', 'easy', 10);

-- Insert sample quiz questions
INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_answer, explanation, order_num)
SELECT 
  q.id,
  'Which oil has the highest smoke point?',
  '["Olive Oil", "Avocado Oil", "Coconut Oil", "Butter"]'::jsonb,
  1,
  'Avocado oil has a smoke point of around 520°F, making it ideal for high-heat cooking.',
  1
FROM public.quizzes q WHERE q.title = 'Oil Basics 101';

INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_answer, explanation, order_num)
SELECT 
  q.id,
  'Trans fats are primarily found in:',
  '["Natural oils", "Partially hydrogenated oils", "Cold-pressed oils", "Olive oil"]'::jsonb,
  1,
  'Trans fats are created during partial hydrogenation, a process used to make oils more solid at room temperature.',
  2
FROM public.quizzes q WHERE q.title = 'Oil Basics 101';

-- Insert sample health content
INSERT INTO public.health_content (title, category, preview, content, tags) VALUES
  ('Did You Know? Oil Absorption Facts', 'did_you_know', 'Deep-fried foods can absorb up to 25% of the cooking oil used.', 'When you deep fry foods, they can absorb between 8-25% of the oil used in cooking. This hidden oil significantly increases calorie intake without you realizing it. Opt for baking, grilling, or air-frying to reduce oil absorption by up to 80%.', ARRAY['oil', 'deep-frying', 'health']),
  ('Myth: All Fats Are Bad', 'myths_facts', 'Learn the truth about dietary fats and your health.', 'MYTH: All fats are bad for you.\n\nFACT: Your body needs healthy fats for hormone production, vitamin absorption, and brain function. The key is choosing the right fats:\n\n✓ Good Fats: Cold-pressed oils, nuts, avocados, fish\n✗ Bad Fats: Trans fats, excessive saturated fats, reused cooking oil\n\nFocus on quality and quantity, not elimination.', ARRAY['myths', 'fats', 'nutrition']),
  ('Hidden Oil Alert: Packaged Snacks', 'hidden_oil', 'Your favorite chips might contain more oil than you think.', 'A small 50g packet of potato chips can contain 15-20ml of oil - that''s nearly your entire daily recommended intake! Other high hidden oil foods include:\n\n• Biscuits and cookies\n• Instant noodles\n• Pastries and cakes\n• Fried snacks\n• Packaged samosas\n\nAlways check nutritional labels for "Total Fat" content. Aim for snacks with less than 10g fat per 100g.', ARRAY['hidden-oil', 'snacks', 'awareness']),
  ('Healthy Cooking Tip: Sautéing', 'cooking_tips', 'Master the art of low-oil sautéing for healthier meals.', 'Sautéing Secrets for Less Oil:\n\n1. Use a non-stick or well-seasoned pan\n2. Preheat the pan before adding oil\n3. Use just 1-2 teaspoons of oil\n4. Add a splash of water or broth if food sticks\n5. Keep ingredients moving with a spatula\n6. Cook in batches to avoid overcrowding\n\nThis method uses 70% less oil than traditional frying while keeping food delicious and nutritious.', ARRAY['cooking', 'tips', 'sauteing']),
  ('Health Risk: Excess Oil Consumption', 'health_risks', 'Understanding the long-term effects of high oil intake.', 'Consuming more than 25ml of oil daily can increase your risk of:\n\n• Heart disease and high cholesterol\n• Obesity and weight gain\n• Type 2 diabetes\n• High blood pressure\n• Fatty liver disease\n\nThe good news? Reducing oil intake by just 20% can significantly improve these health markers within weeks. Small changes, big impact.', ARRAY['health', 'risks', 'prevention']);

-- Insert sample nudge templates
INSERT INTO public.nudge_templates (template_text, trigger_type, priority, icon) VALUES
  ('Your Health Score dropped yesterday due to high oil usage. Try a Fit Meal recipe today!', 'health_score_drop', 1, 'TrendingDown'),
  ('You''ve consumed a lot of hidden oil from packaged foods this week. Check labels more carefully.', 'high_hidden_oil', 2, 'AlertCircle'),
  ('Great progress! You used 30% less oil than last week. Keep it up!', 'low_oil_week', 3, 'TrendingUp'),
  ('Consider switching to mustard or groundnut oil to improve your Health Score.', 'oil_quality_suggestion', 2, 'Lightbulb'),
  ('You haven''t logged any oil usage in 3 days. Don''t forget to track!', 'no_tracking', 1, 'Calendar');