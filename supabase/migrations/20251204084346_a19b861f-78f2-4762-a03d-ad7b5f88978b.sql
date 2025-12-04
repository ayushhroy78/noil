-- Create oil_reduction_goals table
CREATE TABLE public.oil_reduction_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Goal',
  family_size INTEGER NOT NULL DEFAULT 1,
  current_annual_oil_kg NUMERIC NOT NULL,
  target_reduction_percent NUMERIC NOT NULL,
  oil_price_per_liter NUMERIC NOT NULL DEFAULT 150,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.oil_reduction_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own goals" 
ON public.oil_reduction_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON public.oil_reduction_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.oil_reduction_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.oil_reduction_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_oil_reduction_goals_updated_at
BEFORE UPDATE ON public.oil_reduction_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();