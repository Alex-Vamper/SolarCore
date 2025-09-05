-- Create admin schema if not exists
CREATE SCHEMA IF NOT EXISTS admin;

-- 1. Admin registry (pre-registered IDs - created by Admin app)
CREATE TABLE IF NOT EXISTS admin.admin_devices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  esp_id text UNIQUE NOT NULL,
  provider text NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 2. Admin Device Types (pre-registered device classes, series, and actions)
CREATE TABLE IF NOT EXISTS admin.device_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_class text NOT NULL,
  device_series text NOT NULL,
  actions jsonb NOT NULL,
  UNIQUE (device_class, device_series)
);

-- 3. Parent devices (claimed by user accounts)
CREATE TABLE IF NOT EXISTS public.parent_devices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  esp_id text NOT NULL,
  owner_account uuid REFERENCES auth.users(id) NOT NULL,
  status text DEFAULT 'inactive',
  is_demo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (esp_id)
);

-- 4. Child devices (virtual devices under a parent)
CREATE TABLE IF NOT EXISTS public.child_devices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid REFERENCES parent_devices(id) ON DELETE CASCADE,
  device_type_id uuid REFERENCES admin.device_types(id) NOT NULL,
  device_name text NULL,
  state jsonb DEFAULT '{}' NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Device audit logs
CREATE TABLE IF NOT EXISTS public.device_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE admin.admin_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: check if requester is owner of parent device
CREATE OR REPLACE FUNCTION public.is_owner_parent(parent_uuid uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE 
AS $$
  SELECT (owner_account = auth.uid()) 
  FROM parent_devices 
  WHERE id = parent_uuid;
$$;

-- Reuse existing is_superadmin function
-- It already exists as public.is_superadmin(user_email text)

-- RLS Policies for admin.admin_devices
CREATE POLICY "admin devices select for authenticated"
ON admin.admin_devices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin devices insert for superadmins"
ON admin.admin_devices
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "admin devices update for superadmins"
ON admin.admin_devices
FOR UPDATE
TO authenticated
USING (
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "admin devices delete for superadmins"
ON admin.admin_devices
FOR DELETE
TO authenticated
USING (
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- RLS Policies for admin.device_types
CREATE POLICY "device types select for authenticated"
ON admin.device_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "device types write for superadmins"
ON admin.device_types
FOR ALL
TO authenticated
USING (
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- RLS Policies for parent_devices
CREATE POLICY "parent select owner or superadmin"
ON public.parent_devices
FOR SELECT
TO authenticated
USING (
  owner_account = auth.uid() OR 
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "parent insert if not claimed"
ON public.parent_devices
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM admin.admin_devices 
    WHERE admin.admin_devices.esp_id = parent_devices.esp_id
  ) AND
  NOT EXISTS (
    SELECT 1 FROM parent_devices pd 
    WHERE pd.esp_id = parent_devices.esp_id
  )
);

CREATE POLICY "parent update owner or superadmin"
ON public.parent_devices
FOR UPDATE
TO authenticated
USING (
  owner_account = auth.uid() OR 
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
  owner_account = auth.uid() OR 
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "parent delete owner or superadmin"
ON public.parent_devices
FOR DELETE
TO authenticated
USING (
  owner_account = auth.uid() OR 
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- RLS Policies for child_devices
CREATE POLICY "child select owner or superadmin"
ON public.child_devices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM parent_devices p 
    WHERE p.id = child_devices.parent_id 
    AND (
      p.owner_account = auth.uid() OR 
      public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  )
);

CREATE POLICY "child insert only parent owner"
ON public.child_devices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_devices p
    WHERE p.id = child_devices.parent_id
    AND p.owner_account = auth.uid()
  )
);

CREATE POLICY "child update owner or superadmin"
ON public.child_devices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM parent_devices p
    WHERE p.id = child_devices.parent_id
    AND (
      p.owner_account = auth.uid() OR 
      public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_devices p
    WHERE p.id = child_devices.parent_id
    AND (
      p.owner_account = auth.uid() OR 
      public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  )
);

CREATE POLICY "child delete owner or superadmin"
ON public.child_devices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM parent_devices p
    WHERE p.id = child_devices.parent_id
    AND (
      p.owner_account = auth.uid() OR 
      public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  )
);

-- RLS Policies for device_audit_logs
CREATE POLICY "audit logs select own or superadmin"
ON public.device_audit_logs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "audit logs insert authenticated"
ON public.device_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_devices_updated_at
BEFORE UPDATE ON public.parent_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_device_updated_at();

CREATE TRIGGER update_child_devices_updated_at
BEFORE UPDATE ON public.child_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_device_updated_at();

-- RPC: claim_parent_device
CREATE OR REPLACE FUNCTION public.claim_parent_device(p_esp_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_id uuid;
  v_owner_id uuid;
BEGIN
  -- Check if esp_id exists in admin registry
  IF NOT EXISTS (
    SELECT 1 FROM admin.admin_devices 
    WHERE esp_id = p_esp_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNREGISTERED_DEVICE',
      'message', 'This device ID is not registered in the system'
    );
  END IF;

  -- Check if already claimed
  SELECT id, owner_account INTO v_parent_id, v_owner_id
  FROM parent_devices
  WHERE esp_id = p_esp_id;

  IF v_parent_id IS NOT NULL THEN
    IF v_owner_id = auth.uid() THEN
      -- Already owned by this user
      RETURN jsonb_build_object(
        'success', true,
        'parent_id', v_parent_id,
        'message', 'Device already claimed by you'
      );
    ELSE
      -- Owned by someone else
      RETURN jsonb_build_object(
        'success', false,
        'code', 'ALREADY_CLAIMED',
        'message', 'This device is already claimed by another account'
      );
    END IF;
  END IF;

  -- Claim the device
  INSERT INTO parent_devices (esp_id, owner_account, status, is_demo)
  VALUES (p_esp_id, auth.uid(), 'active', true)
  RETURNING id INTO v_parent_id;

  -- Log the action
  INSERT INTO device_audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('claim', 'parent_device', v_parent_id, auth.uid(), 
    jsonb_build_object('esp_id', p_esp_id));

  RETURN jsonb_build_object(
    'success', true,
    'parent_id', v_parent_id,
    'message', 'Device successfully claimed'
  );
END;
$$;

-- RPC: create_child_device
CREATE OR REPLACE FUNCTION public.create_child_device(
  p_parent_id uuid,
  p_device_type_id uuid,
  p_device_name text DEFAULT NULL,
  p_initial_state jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_child_id uuid;
  v_is_demo boolean;
BEGIN
  -- Check if user owns the parent device
  IF NOT public.is_owner_parent(p_parent_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_PARENT_OWNER',
      'message', 'You do not own this parent device'
    );
  END IF;

  -- Check if device_type exists
  IF NOT EXISTS (
    SELECT 1 FROM admin.device_types 
    WHERE id = p_device_type_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_DEVICE_TYPE',
      'message', 'Invalid device type specified'
    );
  END IF;

  -- Check demo mode
  SELECT is_demo INTO v_is_demo
  FROM parent_devices
  WHERE id = p_parent_id;

  -- If not demo mode, check if child already exists
  IF NOT v_is_demo AND EXISTS (
    SELECT 1 FROM child_devices 
    WHERE parent_id = p_parent_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PRODUCTION_MODE_LIMIT',
      'message', 'This device is in production mode and already has a child device'
    );
  END IF;

  -- Create the child device
  INSERT INTO child_devices (
    parent_id, 
    device_type_id, 
    device_name, 
    state, 
    created_by
  )
  VALUES (
    p_parent_id, 
    p_device_type_id, 
    p_device_name, 
    p_initial_state, 
    auth.uid()
  )
  RETURNING id INTO v_child_id;

  -- Log the action
  INSERT INTO device_audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('create', 'child_device', v_child_id, auth.uid(), 
    jsonb_build_object(
      'parent_id', p_parent_id,
      'device_type_id', p_device_type_id,
      'device_name', p_device_name
    ));

  RETURN jsonb_build_object(
    'success', true,
    'child_id', v_child_id,
    'message', 'Child device created successfully'
  );
END;
$$;

-- RPC: update_child_state
CREATE OR REPLACE FUNCTION public.update_child_state(
  p_child_id uuid,
  p_new_state jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_id uuid;
  v_esp_id text;
  v_old_state jsonb;
BEGIN
  -- Get parent_id and check ownership
  SELECT cd.parent_id, cd.state INTO v_parent_id, v_old_state
  FROM child_devices cd
  JOIN parent_devices pd ON pd.id = cd.parent_id
  WHERE cd.id = p_child_id
    AND (pd.owner_account = auth.uid() OR 
         public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())));

  IF v_parent_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_DEVICE_OWNER',
      'message', 'You do not own this device'
    );
  END IF;

  -- Update the state
  UPDATE child_devices
  SET state = p_new_state
  WHERE id = p_child_id;

  -- Get ESP ID for MQTT publishing
  SELECT esp_id INTO v_esp_id
  FROM parent_devices
  WHERE id = v_parent_id;

  -- Log the action
  INSERT INTO device_audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('update_state', 'child_device', p_child_id, auth.uid(), 
    jsonb_build_object(
      'old_state', v_old_state,
      'new_state', p_new_state,
      'esp_id', v_esp_id
    ));

  -- Return success with ESP ID for MQTT publishing
  RETURN jsonb_build_object(
    'success', true,
    'esp_id', v_esp_id,
    'parent_id', v_parent_id,
    'message', 'Device state updated successfully'
  );
END;
$$;

-- RPC: transfer_parent_ownership (superadmin only)
CREATE OR REPLACE FUNCTION public.transfer_parent_ownership(
  p_parent_id uuid,
  p_new_owner uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if superadmin
  IF NOT public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', 'Only superadmins can transfer ownership'
    );
  END IF;

  -- Update ownership
  UPDATE parent_devices
  SET owner_account = p_new_owner
  WHERE id = p_parent_id;

  -- Log the action
  INSERT INTO device_audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('transfer_ownership', 'parent_device', p_parent_id, auth.uid(), 
    jsonb_build_object('new_owner', p_new_owner));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Ownership transferred successfully'
  );
END;
$$;

-- RPC: set_demo_mode (superadmin only)
CREATE OR REPLACE FUNCTION public.set_demo_mode(
  p_parent_id uuid,
  p_is_demo boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if superadmin
  IF NOT public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', 'Only superadmins can change demo mode'
    );
  END IF;

  -- Update demo mode
  UPDATE parent_devices
  SET is_demo = p_is_demo
  WHERE id = p_parent_id;

  -- Log the action
  INSERT INTO device_audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('set_demo_mode', 'parent_device', p_parent_id, auth.uid(), 
    jsonb_build_object('is_demo', p_is_demo));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Demo mode updated successfully'
  );
END;
$$;

-- RPC: migrate_parent_to_production
CREATE OR REPLACE FUNCTION public.migrate_parent_to_production(
  p_parent_id uuid,
  p_canonical_child_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_child_count integer;
BEGIN
  -- Check if superadmin
  IF NOT public.is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', 'Only superadmins can migrate to production'
    );
  END IF;

  -- Verify canonical child belongs to parent
  IF NOT EXISTS (
    SELECT 1 FROM child_devices 
    WHERE id = p_canonical_child_id 
    AND parent_id = p_parent_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_CHILD',
      'message', 'Specified child device does not belong to this parent'
    );
  END IF;

  -- Count children
  SELECT COUNT(*) INTO v_child_count
  FROM child_devices
  WHERE parent_id = p_parent_id;

  -- Archive/delete other children
  DELETE FROM child_devices
  WHERE parent_id = p_parent_id
  AND id != p_canonical_child_id;

  -- Set production mode
  UPDATE parent_devices
  SET is_demo = false
  WHERE id = p_parent_id;

  -- Log the action
  INSERT INTO device_audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('migrate_to_production', 'parent_device', p_parent_id, auth.uid(), 
    jsonb_build_object(
      'canonical_child_id', p_canonical_child_id,
      'removed_children', v_child_count - 1
    ));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully migrated to production mode'
  );
END;
$$;

-- Populate initial device types
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('lighting', 'LumaCore Lux', '{"set_state": {"power": ["on", "off"], "brightness": [0, 100]}, "get_state": true}'::jsonb),
('lighting', 'LumaCore Pulse', '{"set_state": {"power": ["on", "off"], "brightness": [0, 100], "color": "rgb"}, "get_state": true}'::jsonb),
('socket', 'PowerHub Pro', '{"set_state": {"power": ["on", "off"]}, "get_state": true, "get_metrics": true}'::jsonb),
('socket', 'PowerHub Mini', '{"set_state": {"power": ["on", "off"]}, "get_state": true}'::jsonb),
('security', 'SecureLock', '{"set_state": {"locked": ["locked", "unlocked"]}, "get_state": true, "get_logs": true}'::jsonb),
('climate', 'ThermoCore', '{"set_state": {"power": ["on", "off"], "temperature": [16, 30], "mode": ["cool", "heat", "auto"]}, "get_state": true}'::jsonb),
('fan', 'AeroFlow', '{"set_state": {"power": ["on", "off"], "speed": [1, 5]}, "get_state": true}'::jsonb),
('curtain', 'ShadeMaster', '{"set_state": {"position": [0, 100]}, "get_state": true}'::jsonb),
('sensor', 'SenseGuard Motion', '{"get_state": true, "get_logs": true}'::jsonb),
('sensor', 'SenseGuard Temp', '{"get_state": true, "get_metrics": true}'::jsonb),
('ai', 'Ander AI', '{"voice_command": true, "get_state": true}'::jsonb)
ON CONFLICT (device_class, device_series) DO NOTHING;

-- Populate demo ESP IDs
INSERT INTO admin.admin_devices (esp_id, provider) VALUES
('SC-GID-0001', 'SolarCore'),
('SC-GID-0002', 'SolarCore'),
('SC-GID-0003', 'SolarCore')
ON CONFLICT (esp_id) DO NOTHING;