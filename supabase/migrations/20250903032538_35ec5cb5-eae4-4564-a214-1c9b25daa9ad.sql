-- Remove notification_preferences column from user_settings table if it exists
-- This column was referenced in the code but doesn't exist in the database
ALTER TABLE public.user_settings 
DROP COLUMN IF EXISTS notification_preferences;

-- Update voice_commands RLS policies to make audio responses global from superadmin accounts
-- First drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own voice commands" ON public.voice_commands;
DROP POLICY IF EXISTS "Users can create own voice commands" ON public.voice_commands;
DROP POLICY IF EXISTS "Users can update own voice commands" ON public.voice_commands;
DROP POLICY IF EXISTS "Users can delete own voice commands" ON public.voice_commands;

-- Create new policies with global audio response logic
CREATE POLICY "Users can view voice commands with global audio" 
ON public.voice_commands 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  -- Allow viewing commands with audio from superadmins
  (
    audio_url IS NOT NULL 
    AND user_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id IN (
        SELECT id FROM auth.users 
        WHERE email IN (
          'samuelalexander005@gmail.com',
          'samuelalexander851@gmail.com', 
          'ghostrevamper@gmail.com'
        )
      )
    )
  )
);

CREATE POLICY "Users can create own voice commands" 
ON public.voice_commands 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice commands" 
ON public.voice_commands 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice commands" 
ON public.voice_commands 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update the process-audio-upload edge function to propagate audio globally from superadmins
-- This is handled in the edge function code, but we'll add a helper function
CREATE OR REPLACE FUNCTION public.is_superadmin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN user_email IN (
    'samuelalexander005@gmail.com',
    'samuelalexander851@gmail.com',
    'ghostrevamper@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;