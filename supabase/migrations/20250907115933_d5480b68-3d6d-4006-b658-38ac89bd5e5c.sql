-- Fix device deletion and implement global voice command system

-- 1. First, drop and recreate the deletion policy with proper permissions
DROP POLICY IF EXISTS "Users can delete their own child devices" ON public.child_devices;

CREATE POLICY "Users can delete own child devices"
ON public.child_devices
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM parent_devices 
    WHERE parent_devices.id = child_devices.parent_id 
    AND parent_devices.owner_account = auth.uid()
  )
);

-- 2. Modify admin_ander_commands table to support global voice commands
ALTER TABLE public.admin_ander_commands
ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS action_type text;

-- 3. Create a function to get global commands (admin_ander_commands)
CREATE OR REPLACE FUNCTION public.get_global_voice_commands()
RETURNS TABLE(
  id uuid,
  command_category text,
  command_name text,
  keywords text[],
  response_text text,
  audio_url text,
  action_type text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    aac.id,
    aac.command_category,
    aac.command_name,
    aac.keywords,
    aac.response_text,
    aac.audio_url,
    aac.action_type,
    aac.is_active
  FROM admin_ander_commands aac
  WHERE aac.is_active = true
  ORDER BY aac.command_category, aac.command_name;
END;
$function$;

-- 4. Update RLS policies for admin_ander_commands to allow read access for all authenticated users
DROP POLICY IF EXISTS "Admins can view all commands" ON public.admin_ander_commands;

CREATE POLICY "Authenticated users can view active commands"
ON public.admin_ander_commands
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- 5. Create policy for admin users to update global commands
CREATE POLICY "Admin users can update commands"
ON public.admin_ander_commands
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_id IN (
      SELECT id FROM auth.users 
      WHERE email IN (
        'samuelalexander005@gmail.com',
        'samuelalexander851@gmail.com',
        'ghostrevamper@gmail.com'
      )
    )
  )
);

-- 6. Populate initial global commands if they don't exist
INSERT INTO admin_ander_commands (command_category, command_name, keywords, response_text, action_type, is_active, created_by)
VALUES 
  -- System Commands
  ('System', 'System Status', ARRAY['system status', 'status report', 'how are systems'], 'All systems are functioning normally. Power is stable and all safety systems are active.', 'status', true, auth.uid()),
  ('System', 'Emergency Shutdown', ARRAY['emergency shutdown', 'shutdown all', 'emergency stop'], 'Initiating emergency shutdown. All systems will be powered down.', 'emergency_shutdown', true, auth.uid()),
  ('System', 'Reset System', ARRAY['reset system', 'system reset', 'restart system'], 'System reset initiated. Please wait while all systems restart.', 'reset', true, auth.uid()),
  
  -- Lighting Commands
  ('Lighting', 'Turn On Lights', ARRAY['turn on lights', 'lights on', 'switch on lights'], 'Turning on the lights.', 'lights_on', true, auth.uid()),
  ('Lighting', 'Turn Off Lights', ARRAY['turn off lights', 'lights off', 'switch off lights'], 'Turning off the lights.', 'lights_off', true, auth.uid()),
  ('Lighting', 'Dim Lights', ARRAY['dim lights', 'reduce brightness', 'lower lights'], 'Dimming the lights to 50%.', 'dim_lights', true, auth.uid()),
  ('Lighting', 'Brighten Lights', ARRAY['brighten lights', 'increase brightness', 'brighter'], 'Increasing light brightness to maximum.', 'brighten_lights', true, auth.uid()),
  
  -- Shading Commands
  ('Shading', 'Open Curtains', ARRAY['open curtains', 'curtains open', 'open blinds'], 'Opening the curtains.', 'curtains_open', true, auth.uid()),
  ('Shading', 'Close Curtains', ARRAY['close curtains', 'curtains close', 'close blinds'], 'Closing the curtains.', 'curtains_close', true, auth.uid()),
  
  -- HVAC Commands
  ('HVAC', 'Turn On AC', ARRAY['turn on ac', 'ac on', 'start cooling'], 'Turning on the air conditioning.', 'ac_on', true, auth.uid()),
  ('HVAC', 'Turn Off AC', ARRAY['turn off ac', 'ac off', 'stop cooling'], 'Turning off the air conditioning.', 'ac_off', true, auth.uid()),
  ('HVAC', 'Increase Temperature', ARRAY['increase temperature', 'warmer', 'raise temperature'], 'Increasing temperature by 2 degrees.', 'temp_up', true, auth.uid()),
  ('HVAC', 'Decrease Temperature', ARRAY['decrease temperature', 'cooler', 'lower temperature'], 'Decreasing temperature by 2 degrees.', 'temp_down', true, auth.uid()),
  
  -- Socket Commands
  ('Sockets', 'Turn On Sockets', ARRAY['turn on sockets', 'sockets on', 'enable power'], 'Turning on all power sockets.', 'sockets_on', true, auth.uid()),
  ('Sockets', 'Turn Off Sockets', ARRAY['turn off sockets', 'sockets off', 'disable power'], 'Turning off all power sockets.', 'sockets_off', true, auth.uid()),
  
  -- Safety Commands
  ('Safety', 'Arm Security', ARRAY['arm security', 'activate security', 'enable security'], 'Security system armed.', 'arm_security', true, auth.uid()),
  ('Safety', 'Disarm Security', ARRAY['disarm security', 'deactivate security', 'disable security'], 'Security system disarmed.', 'disarm_security', true, auth.uid()),
  ('Safety', 'Check Smoke Sensors', ARRAY['check smoke', 'smoke status', 'smoke sensors'], 'Smoke sensors are clear. No smoke detected.', 'check_smoke', true, auth.uid()),
  ('Safety', 'Check Gas Sensors', ARRAY['check gas', 'gas status', 'gas sensors'], 'Gas sensors are normal. No gas leak detected.', 'check_gas', true, auth.uid())
ON CONFLICT (command_name, command_category) DO NOTHING;

-- 7. Create an index for faster keyword searches
CREATE INDEX IF NOT EXISTS idx_admin_commands_keywords ON admin_ander_commands USING GIN(keywords);

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_global_voice_commands() TO authenticated;