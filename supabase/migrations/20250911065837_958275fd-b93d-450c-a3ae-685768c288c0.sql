-- Migration to move safety systems from legacy table to child_devices

-- First, create any missing device types for safety systems
INSERT INTO admin.device_types (device_class, device_series, actions)
VALUES 
  ('safety', 'fire_detection', '["detect_fire", "activate_suppression", "monitor_smoke", "check_temperature"]'::jsonb),
  ('safety', 'window_rain', '["detect_rain", "control_window", "monitor_water", "alert_rain"]'::jsonb),
  ('safety', 'gas_leak', '["detect_gas", "alert_leak", "monitor_air"]'::jsonb),
  ('safety', 'water_overflow', '["monitor_water", "detect_overflow", "alert_level"]'::jsonb)
ON CONFLICT (device_class, device_series) DO NOTHING;

-- Migrate existing safety_systems data to child_devices
DO $$
DECLARE
    safety_rec RECORD;
    device_type_id UUID;
    new_child_id UUID;
BEGIN
    -- Loop through existing safety systems
    FOR safety_rec IN 
        SELECT * FROM safety_systems
    LOOP
        -- Get the appropriate device type
        SELECT id INTO device_type_id
        FROM admin.device_types
        WHERE device_class = 'safety' AND device_series = safety_rec.system_type;
        
        -- Only migrate if we have a matching device type
        IF device_type_id IS NOT NULL THEN
            -- Insert into child_devices
            INSERT INTO child_devices (
                device_type_id,
                device_name,
                state,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                device_type_id,
                safety_rec.room_name || ' - ' || safety_rec.system_id,
                jsonb_build_object(
                    'status', COALESCE(safety_rec.status, 'safe'),
                    'system_type', safety_rec.system_type,
                    'room_name', safety_rec.room_name,
                    'smoke_level', COALESCE(safety_rec.smoke_percentage, 0),
                    'temperature', COALESCE(safety_rec.temperature_value, 25),
                    'flame_detected', COALESCE((safety_rec.flame_status = 'detected'), false),
                    'rain_detected', COALESCE((safety_rec.sensor_readings->>'rain_detected')::boolean, false),
                    'window_status', COALESCE(safety_rec.sensor_readings->>'window_status', 'closed'),
                    'gas_level', COALESCE((safety_rec.sensor_readings->>'gas_level')::numeric, 0),
                    'water_level', COALESCE((safety_rec.sensor_readings->>'water_level')::numeric, 0),
                    'last_triggered', safety_rec.last_triggered,
                    'automation_settings', safety_rec.automation_settings
                ),
                safety_rec.user_id,
                safety_rec.created_at,
                safety_rec.updated_at
            )
            RETURNING id INTO new_child_id;
            
            -- Log the migration
            INSERT INTO safety_system_migration (old_safety_id, new_child_id)
            VALUES (safety_rec.id, new_child_id);
        END IF;
    END LOOP;
END $$;