-- Add last_login_at field to user_settings table for tracking user login times
ALTER TABLE public.user_settings 
ADD COLUMN last_login_at timestamp with time zone DEFAULT now();

-- Create index for better performance on login time queries
CREATE INDEX idx_user_settings_last_login_at ON public.user_settings(last_login_at);

-- Update existing records to have a default last_login_at value
UPDATE public.user_settings 
SET last_login_at = created_at 
WHERE last_login_at IS NULL;