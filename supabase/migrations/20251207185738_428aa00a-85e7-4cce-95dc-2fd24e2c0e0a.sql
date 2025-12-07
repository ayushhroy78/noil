-- Create restaurant_applications table
CREATE TABLE public.restaurant_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  food_photos JSONB DEFAULT '[]'::jsonb,
  menu_items JSONB DEFAULT '[]'::jsonb,
  oil_types TEXT[] DEFAULT '{}',
  cooking_methods TEXT[] DEFAULT '{}',
  cuisines TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  daily_customers TEXT,
  years_in_business TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own applications" 
ON public.restaurant_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
ON public.restaurant_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications" 
ON public.restaurant_applications 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications" 
ON public.restaurant_applications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_applications_updated_at
BEFORE UPDATE ON public.restaurant_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);

-- Storage policies for restaurant images
CREATE POLICY "Anyone can view restaurant images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated users can upload restaurant images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own restaurant images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own restaurant images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);