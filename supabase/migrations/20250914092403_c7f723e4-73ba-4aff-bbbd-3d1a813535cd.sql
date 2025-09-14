-- Update admin_set_launch_date to reset splash seen table on new launch date
CREATE OR REPLACE FUNCTION public.admin_set_launch_date(
  p_launch_date timestamp with time zone,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_old_date timestamp with time zone;
  v_new_id uuid;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Check if user is superadmin (using the correct function with parameter)
  IF NOT is_superadmin(v_user_email::text) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only superadmins can set launch dates'
    );
  END IF;

  -- Validate launch date is not in the past
  IF p_launch_date <= now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Launch date cannot be in the past'
    );
  END IF;

  -- Get current active launch date for audit log
  SELECT launch_date INTO v_old_date
  FROM admin_launch_control
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Deactivate all existing launch control records
  UPDATE admin_launch_control 
  SET is_active = false, updated_at = now()
  WHERE is_active = true;

  -- Insert new launch control record
  INSERT INTO admin_launch_control (
    launch_date,
    is_active,
    created_by,
    created_by_name,
    notes
  ) VALUES (
    p_launch_date,
    true,
    v_user_id,
    v_user_email,
    p_notes
  )
  RETURNING id INTO v_new_id;

  -- NEW: Reset splash-seen records so users will see the splash again for the new launch
  BEGIN
    DELETE FROM public.launch_splash_seen;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table might not exist in some environments; ignore
      NULL;
  END;

  -- Log the action to audit logs if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_log_action') THEN
    PERFORM admin_log_action(
      'set_launch_date',
      'launch_control',
      v_new_id,
      p_launch_date::text,
      v_user_id,
      v_user_email,
      jsonb_build_object(
        'old_launch_date', v_old_date,
        'new_launch_date', p_launch_date,
        'notes', p_notes
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'launch_date', p_launch_date,
    'id', v_new_id,
    'message', 'Launch date updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;