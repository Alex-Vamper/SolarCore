-- Add missing columns to admin_ander_commands table
ALTER TABLE public.admin_ander_commands
ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS action_type text;

-- Add unique constraint for upsert operations
ALTER TABLE public.admin_ander_commands
DROP CONSTRAINT IF EXISTS unique_command_name_category;
ALTER TABLE public.admin_ander_commands
ADD CONSTRAINT unique_command_name_category UNIQUE (command_name, command_category);