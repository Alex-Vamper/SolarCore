-- 1) Voice commands table
CREATE TABLE IF NOT EXISTS public.voice_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  command_category TEXT NOT NULL,
  command_name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  response TEXT NOT NULL,
  action_type TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and policies
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_commands' AND policyname = 'Users can view own voice commands'
  ) THEN
    CREATE POLICY "Users can view own voice commands"
      ON public.voice_commands
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_commands' AND policyname = 'Users can create own voice commands'
  ) THEN
    CREATE POLICY "Users can create own voice commands"
      ON public.voice_commands
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_commands' AND policyname = 'Users can update own voice commands'
  ) THEN
    CREATE POLICY "Users can update own voice commands"
      ON public.voice_commands
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_commands' AND policyname = 'Users can delete own voice commands'
  ) THEN
    CREATE POLICY "Users can delete own voice commands"
      ON public.voice_commands
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_voice_commands'
  ) THEN
    CREATE TRIGGER set_timestamp_voice_commands
      BEFORE UPDATE ON public.voice_commands
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) Voice response audios table
CREATE TABLE IF NOT EXISTS public.voice_response_audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  command_id UUID REFERENCES public.voice_commands(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'elevenlabs',
  voice_id TEXT,
  format TEXT NOT NULL DEFAULT 'mp3',
  duration_seconds NUMERIC,
  storage_path TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_response_audios ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_response_audios' AND policyname = 'Users can view own voice audios'
  ) THEN
    CREATE POLICY "Users can view own voice audios"
      ON public.voice_response_audios
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_response_audios' AND policyname = 'Users can create own voice audios'
  ) THEN
    CREATE POLICY "Users can create own voice audios"
      ON public.voice_response_audios
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_response_audios' AND policyname = 'Users can update own voice audios'
  ) THEN
    CREATE POLICY "Users can update own voice audios"
      ON public.voice_response_audios
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'voice_response_audios' AND policyname = 'Users can delete own voice audios'
  ) THEN
    CREATE POLICY "Users can delete own voice audios"
      ON public.voice_response_audios
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_voice_response_audios'
  ) THEN
    CREATE TRIGGER set_timestamp_voice_response_audios
      BEFORE UPDATE ON public.voice_response_audios
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Storage bucket for Ander TTS audio
INSERT INTO storage.buckets (id, name, public)
SELECT 'ander-tts', 'ander-tts', FALSE
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'ander-tts');

-- RLS policies on storage.objects for 'ander-tts' bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read own ander-tts files'
  ) THEN
    CREATE POLICY "Users can read own ander-tts files"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'ander-tts'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can insert own ander-tts files'
  ) THEN
    CREATE POLICY "Users can insert own ander-tts files"
      ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'ander-tts'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own ander-tts files'
  ) THEN
    CREATE POLICY "Users can update own ander-tts files"
      ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'ander-tts'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own ander-tts files'
  ) THEN
    CREATE POLICY "Users can delete own ander-tts files"
      ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'ander-tts'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;
END $$;