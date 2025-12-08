-- Add oil_type column to daily_logs table for tracking different oil types
ALTER TABLE public.daily_logs 
ADD COLUMN oil_type text DEFAULT 'other';

-- Update existing records to have a default oil type
UPDATE public.daily_logs SET oil_type = 'other' WHERE oil_type IS NULL;