-- Add preferred_language field to user_settings table for multi-language audio support
ALTER TABLE public.user_settings 
ADD COLUMN preferred_language text DEFAULT 'english';

-- Add comment to document supported languages
COMMENT ON COLUMN public.user_settings.preferred_language IS 'User preferred language for voice responses: english, hausa, yoruba, igbo, pidgin';