-- Fix device deletion and implement global voice command system

-- 1. Drop and recreate the deletion policy with proper permissions
DROP POLICY IF EXISTS "Users can delete their own child devices" ON public.child_devices;
DROP POLICY IF EXISTS "Users can delete own child devices" ON public.child_devices;

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

-- 3. Add unique constraint for upsert operations
ALTER TABLE public.admin_ander_commands
DROP CONSTRAINT IF EXISTS unique_command_name_category;
ALTER TABLE public.admin_ander_commands
ADD CONSTRAINT unique_command_name_category UNIQUE (command_name, command_category);

-- 4. Create a function to get global commands (admin_ander_commands)
CREATE OR REPLACE FUNCTION public.get_global_voice_commands()
RETURNS TABLE(
  id uuid,
  command_category text,
  command_name text,
  command_text text,
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
    aac.command_text,
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

-- 5. Update RLS policies for admin_ander_commands 
DROP POLICY IF EXISTS "Admins can view all commands" ON public.admin_ander_commands;
DROP POLICY IF EXISTS "Authenticated users can view active commands" ON public.admin_ander_commands;
DROP POLICY IF EXISTS "Admin users can update commands" ON public.admin_ander_commands;

CREATE POLICY "Authenticated users can view active commands"
ON public.admin_ander_commands
FOR SELECT
USING (auth.uid() IS NOT NULL);

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
INSERT INTO admin_ander_commands (command_category, command_name, command_text, keywords, response_text, action_type, is_active, created_by)
VALUES 
  -- System Commands
  ('System', 'System Status', 'system status', ARRAY['system status', 'status report', 'how are systems'], 'All systems are functioning normally. Power is stable and all safety systems are active.', 'status', true, auth.uid()),
  ('System', 'Emergency Shutdown', 'emergency shutdown', ARRAY['emergency shutdown', 'shutdown all', 'emergency stop'], 'Initiating emergency shutdown. All systems will be powered down.', 'emergency_shutdown', true, auth.uid()),
  ('System', 'Reset System', 'reset system', ARRAY['reset system', 'system reset', 'restart system'], 'System reset initiated. Please wait while all systems restart.', 'reset', true, auth.uid()),
  
  -- Lighting Commands
  ('Lighting', 'Turn On Lights', 'lights on', ARRAY['turn on lights', 'lights on', 'switch on lights'], 'Turning on the lights.', 'lights_on', true, auth.uid()),
  ('Lighting', 'Turn Off Lights', 'lights off', ARRAY['turn off lights', 'lights off', 'switch off lights'], 'Turning off the lights.', 'lights_off', true, auth.uid()),
  ('Lighting', 'Dim Lights', 'dim lights', ARRAY['dim lights', 'reduce brightness', 'lower lights'], 'Dimming the lights to 50%.', 'dim_lights', true, auth.uid()),
  ('Lighting', 'Brighten Lights', 'brighten lights', ARRAY['brighten lights', 'increase brightness', 'brighter'], 'Increasing light brightness to maximum.', 'brighten_lights', true, auth.uid()),
  
  -- Shading Commands
  ('Shading', 'Open Curtains', 'open curtains', ARRAY['open curtains', 'curtains open', 'open blinds'], 'Opening the curtains.', 'curtains_open', true, auth.uid()),
  ('Shading', 'Close Curtains', 'close curtains', ARRAY['close curtains', 'curtains close', 'close blinds'], 'Closing the curtains.', 'curtains_close', true, auth.uid()),
  
  -- HVAC Commands
  ('HVAC', 'Turn On AC', 'ac on', ARRAY['turn on ac', 'ac on', 'start cooling'], 'Turning on the air conditioning.', 'ac_on', true, auth.uid()),
  ('HVAC', 'Turn Off AC', 'ac off', ARRAY['turn off ac', 'ac off', 'stop cooling'], 'Turning off the air conditioning.', 'ac_off', true, auth.uid()),
  ('HVAC', 'Increase Temperature', 'increase temperature', ARRAY['increase temperature', 'warmer', 'raise temperature'], 'Increasing temperature by 2 degrees.', 'temp_up', true, auth.uid()),
  ('HVAC', 'Decrease Temperature', 'decrease temperature', ARRAY['decrease temperature', 'cooler', 'lower temperature'], 'Decreasing temperature by 2 degrees.', 'temp_down', true, auth.uid()),
  
  -- Socket Commands
  ('Sockets', 'Turn On Sockets', 'sockets on', ARRAY['turn on sockets', 'sockets on', 'enable power'], 'Turning on all power sockets.', 'sockets_on', true, auth.uid()),
  ('Sockets', 'Turn Off Sockets', 'sockets off', ARRAY['turn off sockets', 'sockets off', 'disable power'], 'Turning off all power sockets.', 'sockets_off', true, auth.uid()),
  
  -- Safety Commands
  ('Safety', 'Arm Security', 'arm security', ARRAY['arm security', 'activate security', 'enable security'], 'Security system armed.', 'arm_security', true, auth.uid()),
  ('Safety', 'Disarm Security', 'disarm security', ARRAY['disarm security', 'deactivate security', 'disable security'], 'Security system disarmed.', 'disarm_security', true, auth.uid()),
  ('Safety', 'Check Smoke Sensors', 'check smoke', ARRAY['check smoke', 'smoke status', 'smoke sensors'], 'Smoke sensors are clear. No smoke detected.', 'check_smoke', true, auth.uid()),
  ('Safety', 'Check Gas Sensors', 'check gas', ARRAY['check gas', 'gas status', 'gas sensors'], 'Gas sensors are normal. No gas leak detected.', 'check_gas', true, auth.uid())
ON CONFLICT (command_name, command_category) DO UPDATE
SET 
  command_text = EXCLUDED.command_text,
  keywords = EXCLUDED.keywords,
  response_text = EXCLUDED.response_text,
  action_type = EXCLUDED.action_type,
  is_active = EXCLUDED.is_active;

-- 7. Create an index for faster keyword searches
CREATE INDEX IF NOT EXISTS idx_admin_commands_keywords ON admin_ander_commands USING GIN(keywords);

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_global_voice_commands() TO authenticated;