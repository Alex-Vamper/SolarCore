-- Add Paystack fields to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS paystack_reference text,
ADD COLUMN IF NOT EXISTS paystack_customer_code text,
ADD COLUMN IF NOT EXISTS subscription_amount_kobo integer;