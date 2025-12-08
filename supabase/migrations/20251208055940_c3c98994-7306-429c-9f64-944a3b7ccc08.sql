-- Add blockchain certification fields to restaurant_applications table
ALTER TABLE public.restaurant_applications
ADD COLUMN IF NOT EXISTS blockchain_certified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS blockchain_hash text,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash text,
ADD COLUMN IF NOT EXISTS blockchain_network text,
ADD COLUMN IF NOT EXISTS blockchain_certified_at timestamp with time zone;