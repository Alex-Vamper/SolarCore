-- Add subscription and Ander-related fields to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS ander_device_id text,
ADD COLUMN IF NOT EXISTS ander_button_position jsonb DEFAULT '{"x": 20, "y": 20}'::jsonb;