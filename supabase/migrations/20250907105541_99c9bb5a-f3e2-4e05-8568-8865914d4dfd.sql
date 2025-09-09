-- Create RLS policy for deleting child devices
-- Users can delete child devices that belong to parent devices they own
CREATE POLICY "Users can delete their own child devices" 
ON public.child_devices 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM parent_devices 
    WHERE parent_devices.id = child_devices.parent_id 
    AND parent_devices.owner_account = auth.uid()
  )
);