-- Update device_types table with correct data
DELETE FROM admin.device_types;

-- Smart Lighting devices
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('smart_lighting', 'LumaCore Halo', '["on", "off", "dim", "color"]'),
('smart_lighting', 'LumaCore Pulse', '["on", "off", "dim", "color"]'),
('smart_lighting', 'LumaCore Lux', '["on", "off", "dim", "color"]'),
('smart_lighting', 'SolarDome One', '["on", "off", "dim"]'),
('smart_lighting', 'SolarDome Neo', '["on", "off", "dim"]'),
('smart_lighting', 'OptiCore Glow', '["on", "off", "dim"]'),
('smart_lighting', 'OptiCore Edge', '["on", "off", "dim"]'),
('smart_lighting', 'OptiCore Aura', '["on", "off", "dim", "color"]');

-- Smart HVAC devices
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('smart_hvac', 'ClimaCore Basic', '["on", "off", "set_temperature", "fan_speed"]'),
('smart_hvac', 'ClimaCore Pro', '["on", "off", "set_temperature", "fan_speed", "mode"]');

-- Smart Shading devices
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('smart_shading', 'ShadeCore Glide', '["open", "close", "set_position"]'),
('smart_shading', 'ShadeCore Lux', '["open", "close", "set_position", "tilt"]'),
('smart_shading', 'ShadeCore Touch', '["open", "close", "set_position"]'),
('smart_shading', 'D-W Sense', '["open", "close", "set_position", "auto"]');

-- Smart Socket devices
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('smart_socket', 'S-Plug', '["on", "off"]'),
('smart_socket', 'S-Plug Duo', '["on", "off", "socket1", "socket2"]');

-- Smart Camera devices
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('smart_camera', 'Cam Mini', '["on", "off", "record", "snapshot"]'),
('smart_camera', 'Cam 360', '["on", "off", "record", "snapshot", "pan", "tilt"]'),
('smart_camera', 'Cam Door', '["on", "off", "record", "snapshot", "two_way_audio"]');

-- Motion Sensor devices
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('motion_sensor', 'MotionSense', '["enable", "disable", "sensitivity"]');

-- Air Quality devices
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('air_quality', 'SenseSmoke', '["enable", "disable", "test"]'),
('air_quality', 'SenseGas', '["enable", "disable", "test"]');

-- Security devices (for door security)
INSERT INTO admin.device_types (device_class, device_series, actions) VALUES
('security', 'S-Core Lite', '["lock", "unlock", "status"]'),
('security', 'S-Core Bio', '["lock", "unlock", "status", "fingerprint"]'),
('security', 'S-Core Ultra', '["lock", "unlock", "status", "fingerprint", "face_recognition"]');

-- Update admin_devices table with ESP IDs from 0001 to 0100
DELETE FROM admin.admin_devices;

-- Generate ESP IDs from 0001 to 0100
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO admin.admin_devices (esp_id) 
    VALUES ('SC-GID-' || LPAD(i::text, 4, '0'));
  END LOOP;
END $$;