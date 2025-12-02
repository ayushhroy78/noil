-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create products table for oils and IoT devices
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  product_type text NOT NULL, -- 'oil' or 'iot_device'
  oil_type text, -- mustard, groundnut, coconut, sesame, etc.
  health_tags text[] DEFAULT '{}',
  region_tags text[] DEFAULT '{}', -- for region-based recommendations
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create product_variants table for different sizes/prices
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name text NOT NULL, -- '250ml', '500ml', '1L'
  price numeric NOT NULL,
  stock_quantity integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  total_amount numeric NOT NULL,
  delivery_charges numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  delivery_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  quantity integer NOT NULL,
  price_at_purchase numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create iot_devices table
CREATE TABLE public.iot_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  device_id text NOT NULL UNIQUE, -- physical device ID
  device_name text,
  linked_bottle_id uuid REFERENCES public.bottles(id),
  linked_oil_type text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create iot_usage_logs table
CREATE TABLE public.iot_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  volume_used_ml numeric NOT NULL,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  synced_to_tracking boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_profiles table for region data
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  region text,
  state text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read)
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view product variants"
  ON public.product_variants FOR SELECT
  USING (true);

-- RLS Policies for cart_items
CREATE POLICY "Users can view their own cart items"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

-- RLS Policies for IoT devices
CREATE POLICY "Users can view their own IoT devices"
  ON public.iot_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own IoT devices"
  ON public.iot_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IoT devices"
  ON public.iot_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IoT devices"
  ON public.iot_devices FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for IoT usage logs
CREATE POLICY "Users can view their own IoT usage logs"
  ON public.iot_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own IoT usage logs"
  ON public.iot_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_iot_devices_updated_at
  BEFORE UPDATE ON public.iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for products
INSERT INTO public.products (name, description, product_type, oil_type, health_tags, region_tags) VALUES
  ('Cold-Pressed Mustard Oil', 'Traditional mustard oil, cold-pressed for maximum nutrition', 'oil', 'mustard', ARRAY['Cold-pressed', 'High in MUFA', 'Heart-healthy'], ARRAY['North', 'East', 'Central']),
  ('Pure Groundnut Oil', 'Light and healthy groundnut oil, perfect for daily cooking', 'oil', 'groundnut', ARRAY['Light', 'High in MUFA', 'Vitamin E'], ARRAY['West', 'Central', 'South']),
  ('Virgin Coconut Oil', 'Premium coconut oil with natural aroma', 'oil', 'coconut', ARRAY['Virgin', 'MCT-rich', 'Immunity boost'], ARRAY['South', 'Coastal']),
  ('Cold-Pressed Sesame Oil', 'Aromatic sesame oil for traditional cooking', 'oil', 'sesame', ARRAY['Cold-pressed', 'Antioxidant-rich', 'Traditional'], ARRAY['South', 'East']),
  ('Rice Bran Oil', 'Light cooking oil with balanced fatty acids', 'oil', 'rice_bran', ARRAY['Light', 'Heart-healthy', 'High smoke point'], ARRAY['East', 'South']),
  ('Extra Virgin Olive Oil', 'Premium olive oil for salads and light cooking', 'oil', 'olive', ARRAY['Extra virgin', 'Antioxidant-rich', 'Mediterranean'], ARRAY['All']),
  ('Smart Oil IoT Device', 'Automatic oil usage tracker that connects to your bottle', 'iot_device', NULL, ARRAY['Smart tracking', 'Bluetooth enabled', 'Real-time sync'], ARRAY['All']);

-- Insert product variants
INSERT INTO public.product_variants (product_id, variant_name, price, stock_quantity)
SELECT id, '250ml', 150, 100 FROM public.products WHERE oil_type = 'mustard'
UNION ALL
SELECT id, '500ml', 280, 100 FROM public.products WHERE oil_type = 'mustard'
UNION ALL
SELECT id, '1L', 520, 100 FROM public.products WHERE oil_type = 'mustard'
UNION ALL
SELECT id, '250ml', 140, 100 FROM public.products WHERE oil_type = 'groundnut'
UNION ALL
SELECT id, '500ml', 260, 100 FROM public.products WHERE oil_type = 'groundnut'
UNION ALL
SELECT id, '1L', 480, 100 FROM public.products WHERE oil_type = 'groundnut'
UNION ALL
SELECT id, '250ml', 180, 100 FROM public.products WHERE oil_type = 'coconut'
UNION ALL
SELECT id, '500ml', 340, 100 FROM public.products WHERE oil_type = 'coconut'
UNION ALL
SELECT id, '1L', 650, 100 FROM public.products WHERE oil_type = 'coconut'
UNION ALL
SELECT id, '250ml', 160, 100 FROM public.products WHERE oil_type = 'sesame'
UNION ALL
SELECT id, '500ml', 300, 100 FROM public.products WHERE oil_type = 'sesame'
UNION ALL
SELECT id, '1L', 560, 100 FROM public.products WHERE oil_type = 'sesame'
UNION ALL
SELECT id, '250ml', 130, 100 FROM public.products WHERE oil_type = 'rice_bran'
UNION ALL
SELECT id, '500ml', 240, 100 FROM public.products WHERE oil_type = 'rice_bran'
UNION ALL
SELECT id, '1L', 450, 100 FROM public.products WHERE oil_type = 'rice_bran'
UNION ALL
SELECT id, '250ml', 320, 100 FROM public.products WHERE oil_type = 'olive'
UNION ALL
SELECT id, '500ml', 620, 100 FROM public.products WHERE oil_type = 'olive'
UNION ALL
SELECT id, '1L', 1180, 100 FROM public.products WHERE oil_type = 'olive'
UNION ALL
SELECT id, 'Single Device', 1299, 50 FROM public.products WHERE product_type = 'iot_device'
UNION ALL
SELECT id, 'Bundle (Device + 1L Oil)', 1699, 50 FROM public.products WHERE product_type = 'iot_device';