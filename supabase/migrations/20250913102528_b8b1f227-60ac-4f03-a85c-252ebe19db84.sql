-- Fix RLS policies that directly reference auth.users table
-- This causes permission denied errors for client roles

-- Update parent_devices policies
DROP POLICY IF EXISTS "parent select owner or superadmin" ON parent_devices;
CREATE POLICY "parent select owner or superadmin" ON parent_devices
FOR SELECT USING (
  (owner_account = auth.uid()) OR 
  public.is_superadmin_uid(auth.uid())
);

DROP POLICY IF EXISTS "parent update owner or superadmin" ON parent_devices;
CREATE POLICY "parent update owner or superadmin" ON parent_devices
FOR UPDATE USING (
  (owner_account = auth.uid()) OR 
  public.is_superadmin_uid(auth.uid())
) WITH CHECK (
  (owner_account = auth.uid()) OR 
  public.is_superadmin_uid(auth.uid())
);

DROP POLICY IF EXISTS "parent delete owner or superadmin" ON parent_devices;
CREATE POLICY "parent delete owner or superadmin" ON parent_devices
FOR DELETE USING (
  (owner_account = auth.uid()) OR 
  public.is_superadmin_uid(auth.uid())
);

-- Update child_devices policies
DROP POLICY IF EXISTS "child select owner or superadmin" ON child_devices;
CREATE POLICY "child select owner or superadmin" ON child_devices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parent_devices p 
    WHERE p.id = child_devices.parent_id 
    AND (p.owner_account = auth.uid() OR public.is_superadmin_uid(auth.uid()))
  )
);

DROP POLICY IF EXISTS "child update owner or superadmin" ON child_devices;
CREATE POLICY "child update owner or superadmin" ON child_devices
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM parent_devices p 
    WHERE p.id = child_devices.parent_id 
    AND (p.owner_account = auth.uid() OR public.is_superadmin_uid(auth.uid()))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_devices p 
    WHERE p.id = child_devices.parent_id 
    AND (p.owner_account = auth.uid() OR public.is_superadmin_uid(auth.uid()))
  )
);

-- Update device_audit_logs policy
DROP POLICY IF EXISTS "audit logs select own or superadmin" ON device_audit_logs;
CREATE POLICY "audit logs select own or superadmin" ON device_audit_logs
FOR SELECT USING (
  (user_id = auth.uid()) OR 
  public.is_superadmin_uid(auth.uid())
);