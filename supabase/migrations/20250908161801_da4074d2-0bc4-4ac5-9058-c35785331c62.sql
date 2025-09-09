-- Fix RLS policies on admin_ander_commands table
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Superadmins and regular admins can view commands" ON admin_ander_commands;
DROP POLICY IF EXISTS "Superadmins and regular admins can create commands" ON admin_ander_commands;

-- Create new policies without direct auth.users access
-- Allow all authenticated users to read active commands (for voice processing)
CREATE POLICY "All authenticated users can read active commands" 
ON admin_ander_commands 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Allow superadmins to manage all commands
CREATE POLICY "Superadmins can manage all commands" 
ON admin_ander_commands 
FOR ALL 
TO authenticated
USING (is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())::text))
WITH CHECK (is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())::text));

-- Allow admin credential users to create and manage commands
CREATE POLICY "Admin credential users can create commands" 
ON admin_ander_commands 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid())::text) OR
  EXISTS (
    SELECT 1 FROM admin_credentials 
    WHERE uid = (SELECT email FROM auth.users WHERE id = auth.uid())::text
       OR uid = replace((SELECT email FROM auth.users WHERE id = auth.uid())::text, '@admin.local', '')
  )
);

-- Allow users to update/delete their own created commands
CREATE POLICY "Users can manage their own commands" 
ON admin_ander_commands 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own commands" 
ON admin_ander_commands 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);