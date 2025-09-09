-- Create RPC function for secure child device deletion
CREATE OR REPLACE FUNCTION public.delete_child_device(p_child_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_parent_id uuid;
  v_device_name text;
BEGIN
  -- Get parent_id and device name, check ownership
  SELECT cd.parent_id, cd.device_name INTO v_parent_id, v_device_name
  FROM child_devices cd
  JOIN parent_devices pd ON pd.id = cd.parent_id
  WHERE cd.id = p_child_id
    AND (pd.owner_account = auth.uid() OR 
         public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())));

  IF v_parent_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_DEVICE_OWNER',
      'message', 'You do not own this device or device not found'
    );
  END IF;

  -- Delete the child device
  DELETE FROM child_devices
  WHERE id = p_child_id;

  -- Log the action
  INSERT INTO device_audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('delete', 'child_device', p_child_id, auth.uid(), 
    jsonb_build_object(
      'parent_id', v_parent_id,
      'device_name', v_device_name
    ));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Device deleted successfully'
  );
END;
$function$;