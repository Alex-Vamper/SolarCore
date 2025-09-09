-- Drop the existing complex DELETE policies that might be causing issues
DROP POLICY IF EXISTS "child delete owner or superadmin" ON public.child_devices;
DROP POLICY IF EXISTS "Users can delete their own child devices" ON public.child_devices;

-- Create a simpler DELETE policy that doesn't reference auth.users
CREATE POLICY "Users can delete their own child devices" 
ON public.child_devices 
FOR DELETE 
USING (
  parent_id IN (
    SELECT id FROM parent_devices 
    WHERE owner_account = auth.uid()
  )
);