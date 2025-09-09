-- Add audio_url field to voice_commands table for storing uploaded audio URLs
ALTER TABLE public.voice_commands 
ADD COLUMN audio_url TEXT;

-- Add command_id foreign key to voice_response_audios for proper linking
ALTER TABLE public.voice_response_audios 
ADD CONSTRAINT fk_voice_response_audios_command_id 
FOREIGN KEY (command_id) REFERENCES public.voice_commands(id) ON DELETE CASCADE;

-- Add is_global flag to voice_commands to distinguish admin vs user commands
ALTER TABLE public.voice_commands 
ADD COLUMN is_global BOOLEAN DEFAULT FALSE;

-- Create index for better performance on audio_url lookups
CREATE INDEX idx_voice_commands_audio_url ON public.voice_commands(audio_url) WHERE audio_url IS NOT NULL;

-- Create index for global commands lookup
CREATE INDEX idx_voice_commands_global ON public.voice_commands(is_global) WHERE is_global = TRUE;