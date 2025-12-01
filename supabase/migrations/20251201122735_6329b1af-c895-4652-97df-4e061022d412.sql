-- Create table for prebuilt low-oil recipes
CREATE TABLE public.recipes_prebuilt (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL,
  steps JSONB NOT NULL,
  oil_estimate_ml NUMERIC NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  cuisine TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  calories INTEGER,
  prep_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI-generated recipe logs
CREATE TABLE public.generated_recipe_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ingredients_input TEXT NOT NULL,
  cuisine_preference TEXT,
  meal_type TEXT,
  recipe_output JSONB NOT NULL,
  oil_estimate_ml NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on recipes_prebuilt (public read access, no write for users)
ALTER TABLE public.recipes_prebuilt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipes"
ON public.recipes_prebuilt
FOR SELECT
USING (true);

-- Enable RLS on generated_recipe_logs
ALTER TABLE public.generated_recipe_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated recipes"
ON public.generated_recipe_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated recipes"
ON public.generated_recipe_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated recipes"
ON public.generated_recipe_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Insert some sample low-oil recipes
INSERT INTO public.recipes_prebuilt (name, ingredients, steps, oil_estimate_ml, tags, cuisine, meal_type, calories, prep_time_minutes) VALUES
('Steamed Momos', 
 '["250g whole wheat flour", "1 cup finely chopped vegetables (carrot, cabbage, beans)", "1 tsp ginger-garlic paste", "2 tsp soy sauce", "Salt and pepper to taste", "1 tsp oil for filling"]',
 '["Mix flour with water to form a soft dough. Rest for 20 minutes.", "Sauté vegetables with ginger-garlic paste in 1 tsp oil for 2-3 minutes.", "Add soy sauce, salt, and pepper. Let it cool.", "Roll small dough balls into thin circles.", "Place filling in center, fold and seal edges.", "Steam in a steamer for 10-12 minutes until cooked."]',
 5, ARRAY['Low oil', 'Steamed', 'Healthy'], 'Asian', 'snack', 180, 40),

('Grilled Paneer Tikka',
 '["200g paneer cubes", "1/2 cup hung curd", "1 tbsp tandoori masala", "1 tsp ginger-garlic paste", "1 bell pepper", "1 onion", "1 tsp oil for marinade", "Lemon juice"]',
 '["Mix curd, tandoori masala, ginger-garlic paste, oil, and lemon juice.", "Add paneer cubes and vegetables. Marinate for 30 minutes.", "Thread paneer and vegetables on skewers.", "Grill in oven or on a grill pan for 10-12 minutes, turning occasionally.", "Serve hot with mint chutney."]',
 8, ARRAY['Very low oil', 'Grilled', 'High protein'], 'Indian', 'dinner', 220, 45),

('Baked Samosa',
 '["2 cups whole wheat flour", "2 medium potatoes (boiled and mashed)", "1/2 cup peas", "1 tsp cumin seeds", "1 tsp garam masala", "2 tsp oil total", "Salt to taste"]',
 '["Knead flour with water and 1 tsp oil to make a stiff dough.", "Heat 1 tsp oil, add cumin seeds, then mashed potatoes and peas.", "Add garam masala and salt. Mix well and let it cool.", "Roll dough into thin circles, cut in half to form cones.", "Fill with potato mixture, seal edges with water.", "Brush lightly with oil and bake at 200°C for 25-30 minutes until golden."]',
 10, ARRAY['Low oil', 'Baked', 'Crispy'], 'Indian', 'snack', 150, 50),

('Oats Idli',
 '["1 cup oats", "1/2 cup rava (semolina)", "1 cup curd", "1 carrot (grated)", "Few curry leaves", "1 tsp mustard seeds", "1/2 tsp oil for tempering", "Salt to taste"]',
 '["Dry roast oats and grind to a coarse powder.", "Mix oats powder, rava, and curd. Add water to make idli batter consistency.", "Let it rest for 15 minutes. Add salt.", "Heat oil, add mustard seeds and curry leaves. Pour over batter.", "Add grated carrot and mix well.", "Pour into greased idli molds and steam for 12-15 minutes."]',
 3, ARRAY['Very low oil', 'Steamed', 'Fiber rich'], 'South Indian', 'breakfast', 120, 30),

('Air-Fried Bhindi',
 '["250g bhindi (okra)", "1 tsp oil", "1/2 tsp turmeric", "1 tsp coriander powder", "1/2 tsp red chili powder", "Salt to taste", "1 tsp amchur (dry mango powder)"]',
 '["Wash and dry bhindi thoroughly. Cut into thin strips.", "In a bowl, toss bhindi with oil and all spices.", "Preheat air fryer to 180°C.", "Place bhindi in air fryer basket in a single layer.", "Air fry for 12-15 minutes, shaking basket halfway through.", "Sprinkle amchur powder and serve hot."]',
 5, ARRAY['Very low oil', 'Air fried', 'Crispy'], 'Indian', 'lunch', 90, 20);
