-- Fix RLS policies on admin_ander_commands table
-- Drop all existing policies first
DROP POLICY IF EXISTS "Superadmins and regular admins can view commands" ON admin_ander_commands;
DROP POLICY IF EXISTS "Superadmins and regular admins can create commands" ON admin_ander_commands;
DROP POLICY IF EXISTS "Users can delete their own commands" ON admin_ander_commands;
DROP POLICY IF EXISTS "Users can update their own commands" ON admin_ander_commands;

-- Create new simplified policies
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

-- Allow admin credential users to create commands
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

-- Allow users to manage their own created commands
CREATE POLICY "Users can manage own created commands" 
ON admin_ander_commands 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own created commands" 
ON admin_ander_commands 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);