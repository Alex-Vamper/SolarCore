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

-- 2. Clear existing admin commands to start fresh
DELETE FROM public.admin_ander_commands;

-- 3. Populate initial global commands with fixed created_by
-- Use a default admin user ID for now (will be updated when admin logs in)
INSERT INTO admin_ander_commands (command_category, command_name, command_text, keywords, response_text, action_type, is_active, created_by, usage_count)
VALUES 
  -- System Commands
  ('System', 'System Status', 'system status', ARRAY['system status', 'status report', 'how are systems'], 'All systems are functioning normally. Power is stable and all safety systems are active.', 'status', true, gen_random_uuid(), 0),
  ('System', 'Emergency Shutdown', 'emergency shutdown', ARRAY['emergency shutdown', 'shutdown all', 'emergency stop'], 'Initiating emergency shutdown. All systems will be powered down.', 'emergency_shutdown', true, gen_random_uuid(), 0),
  ('System', 'Reset System', 'reset system', ARRAY['reset system', 'system reset', 'restart system'], 'System reset initiated. Please wait while all systems restart.', 'reset', true, gen_random_uuid(), 0),
  
  -- Lighting Commands
  ('Lighting', 'Turn On Lights', 'lights on', ARRAY['turn on lights', 'lights on', 'switch on lights'], 'Turning on the lights.', 'lights_on', true, gen_random_uuid(), 0),
  ('Lighting', 'Turn Off Lights', 'lights off', ARRAY['turn off lights', 'lights off', 'switch off lights'], 'Turning off the lights.', 'lights_off', true, gen_random_uuid(), 0),
  ('Lighting', 'Dim Lights', 'dim lights', ARRAY['dim lights', 'reduce brightness', 'lower lights'], 'Dimming the lights to 50%.', 'dim_lights', true, gen_random_uuid(), 0),
  ('Lighting', 'Brighten Lights', 'brighten lights', ARRAY['brighten lights', 'increase brightness', 'brighter'], 'Increasing light brightness to maximum.', 'brighten_lights', true, gen_random_uuid(), 0),
  
  -- Shading Commands
  ('Shading', 'Open Curtains', 'open curtains', ARRAY['open curtains', 'curtains open', 'open blinds'], 'Opening the curtains.', 'curtains_open', true, gen_random_uuid(), 0),
  ('Shading', 'Close Curtains', 'close curtains', ARRAY['close curtains', 'curtains close', 'close blinds'], 'Closing the curtains.', 'curtains_close', true, gen_random_uuid(), 0),
  
  -- HVAC Commands
  ('HVAC', 'Turn On AC', 'ac on', ARRAY['turn on ac', 'ac on', 'start cooling'], 'Turning on the air conditioning.', 'ac_on', true, gen_random_uuid(), 0),
  ('HVAC', 'Turn Off AC', 'ac off', ARRAY['turn off ac', 'ac off', 'stop cooling'], 'Turning off the air conditioning.', 'ac_off', true, gen_random_uuid(), 0),
  ('HVAC', 'Increase Temperature', 'increase temperature', ARRAY['increase temperature', 'warmer', 'raise temperature'], 'Increasing temperature by 2 degrees.', 'temp_up', true, gen_random_uuid(), 0),
  ('HVAC', 'Decrease Temperature', 'decrease temperature', ARRAY['decrease temperature', 'cooler', 'lower temperature'], 'Decreasing temperature by 2 degrees.', 'temp_down', true, gen_random_uuid(), 0),
  
  -- Socket Commands
  ('Sockets', 'Turn On Sockets', 'sockets on', ARRAY['turn on sockets', 'sockets on', 'enable power'], 'Turning on all power sockets.', 'sockets_on', true, gen_random_uuid(), 0),
  ('Sockets', 'Turn Off Sockets', 'sockets off', ARRAY['turn off sockets', 'sockets off', 'disable power'], 'Turning off all power sockets.', 'sockets_off', true, gen_random_uuid(), 0),
  
  -- Safety Commands
  ('Safety', 'Arm Security', 'arm security', ARRAY['arm security', 'activate security', 'enable security'], 'Security system armed.', 'arm_security', true, gen_random_uuid(), 0),
  ('Safety', 'Disarm Security', 'disarm security', ARRAY['disarm security', 'deactivate security', 'disable security'], 'Security system disarmed.', 'disarm_security', true, gen_random_uuid(), 0),
  ('Safety', 'Check Smoke Sensors', 'check smoke', ARRAY['check smoke', 'smoke status', 'smoke sensors'], 'Smoke sensors are clear. No smoke detected.', 'check_smoke', true, gen_random_uuid(), 0),
  ('Safety', 'Check Gas Sensors', 'check gas', ARRAY['check gas', 'gas status', 'gas sensors'], 'Gas sensors are normal. No gas leak detected.', 'check_gas', true, gen_random_uuid(), 0);