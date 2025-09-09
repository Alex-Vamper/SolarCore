-- Add device types for safety and security systems
INSERT INTO admin.device_types (device_class, device_series, description, supported_states) VALUES
('safety', 'fire_detection', 'Fire Detection System with smoke and temperature sensors', '{"status": "safe|alert|active", "flame_status": "clear|flames", "temperature": "number", "smoke_percentage": "number"}'),
('safety', 'rain_detection', 'Rain Detection System with window control', '{"status": "safe|alert", "rain_detected": "boolean", "window_status": "open|closed"}'),
('safety', 'gas_leak', 'Gas Leak Detection System', '{"status": "safe|alert", "gas_level": "number", "sensitivity": "low|medium|high"}'),
('safety', 'water_overflow', 'Water Level Monitoring System', '{"status": "safe|alert", "water_level": "number", "min_level": "number", "max_level": "number", "auto_pump": "boolean"}'),
('security', 'door_control', 'Door Security Control System', '{"lock_status": "locked|unlocked", "security_mode": "home|away", "last_action": "timestamp"}');

-- Migrate existing safety_systems to child_devices
INSERT INTO child_devices (parent_id, device_type_id, device_name, state, created_by)
SELECT 
  -- Use first available parent device for now, this should be updated based on actual ESP mapping
  (SELECT id FROM parent_devices LIMIT 1) as parent_id,
  dt.id as device_type_id,
  ss.system_id as device_name,
  jsonb_build_object(
    'status', ss.status,
    'flame_status', COALESCE(ss.flame_status, 'clear'),
    'temperature', COALESCE(ss.temperature_value, 25),
    'smoke_percentage', COALESCE(ss.smoke_percentage, 0),
    'rain_detected', COALESCE((ss.sensor_readings->>'rain_detected')::boolean, false),
    'window_status', COALESCE(ss.sensor_readings->>'window_status', 'closed'),
    'gas_level', COALESCE((ss.sensor_readings->>'gas_level')::numeric, 0),
    'water_level', COALESCE((ss.sensor_readings->>'water_level')::numeric, 50),
    'min_level', COALESCE((ss.automation_settings->>'min_water_level')::numeric, 20),
    'max_level', COALESCE((ss.automation_settings->>'max_water_level')::numeric, 90),
    'auto_pump', COALESCE((ss.automation_settings->>'auto_pump_toggle')::boolean, false),
    'sensitivity', 'medium',
    'room_name', ss.room_name,
    'last_triggered', ss.last_triggered,
    'automation_settings', ss.automation_settings,
    'sensor_readings', ss.sensor_readings
  ) as state,
  ss.user_id as created_by
FROM safety_systems ss
JOIN admin.device_types dt ON dt.device_series = ss.system_type
WHERE dt.device_class = 'safety';

-- Create a mapping table to track migrated safety systems
CREATE TABLE IF NOT EXISTS safety_system_migration (
  old_safety_id uuid REFERENCES safety_systems(id),
  new_child_id uuid REFERENCES child_devices(id),
  created_at timestamp with time zone DEFAULT now()
);

INSERT INTO safety_system_migration (old_safety_id, new_child_id)
SELECT ss.id, cd.id
FROM safety_systems ss
JOIN admin.device_types dt ON dt.device_series = ss.system_type
JOIN child_devices cd ON cd.device_name = ss.system_id 
  AND cd.created_by = ss.user_id
  AND cd.device_type_id = dt.id
WHERE dt.device_class = 'safety';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_child_devices_device_type ON child_devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_child_devices_parent_state ON child_devices(parent_id, (state->>'status'));
CREATE INDEX IF NOT EXISTS idx_child_devices_user_type ON child_devices(created_by, device_type_id);