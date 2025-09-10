-- Set ander_enabled to false by default for new users
ALTER TABLE public.user_settings ALTER COLUMN ander_enabled SET DEFAULT false;