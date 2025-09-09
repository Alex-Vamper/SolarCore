-- Helper functions to avoid direct references to auth.users in RLS policies
CREATE OR REPLACE FUNCTION public.is_superadmin_uid(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  RETURN public.is_superadmin(v_email::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin_uid(p_user_id);
$$;

-- Fix policies on admin_ander_commands to remove auth.users references
DROP POLICY IF EXISTS "Superadmins can manage all commands" ON public.admin_ander_commands;
DROP POLICY IF EXISTS "Admin credential users can create commands" ON public.admin_ander_commands;

CREATE POLICY "Superadmins can manage all commands"
ON public.admin_ander_commands
FOR ALL
TO authenticated
USING (public.is_superadmin_uid(auth.uid()))
WITH CHECK (public.is_superadmin_uid(auth.uid()));

CREATE POLICY "Admin credential users can create commands"
ON public.admin_ander_commands
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_superadmin_uid(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.admin_credentials c
    WHERE c.uid = (
      SELECT COALESCE(
        NULLIF((SELECT email FROM auth.users WHERE id = auth.uid()), ''),
        ''
      )
    )
  )
);

-- Ensure the read policy exists for all authenticated users to read active commands
DROP POLICY IF EXISTS "All authenticated users can read active commands" ON public.admin_ander_commands;
CREATE POLICY "All authenticated users can read active commands"
ON public.admin_ander_commands
FOR SELECT
TO authenticated
USING (is_active = true);

-- Fix voice_commands SELECT policy to avoid auth.users references
DROP POLICY IF EXISTS "Users can view voice commands with global audio" ON public.voice_commands;
CREATE POLICY "Users can view voice commands with global audio"
ON public.voice_commands
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR (
    audio_url IS NOT NULL AND public.is_superadmin_user(user_id)
  )
);
