-- Phase 1: Complete Data Migration
-- First, let's migrate remaining safety_systems to child_devices

-- Create a migration function to move safety_systems to child_devices
CREATE OR REPLACE FUNCTION migrate_safety_systems_to_child_devices()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  safety_rec RECORD;
  device_type_rec RECORD;
  parent_device_rec RECORD;
  result_count INTEGER := 0;
  error_count INTEGER := 0;
  migration_results jsonb := '{}';
BEGIN
  -- Loop through all safety_systems that haven't been migrated
  FOR safety_rec IN 
    SELECT ss.* 
    FROM safety_systems ss
    WHERE NOT EXISTS (
      SELECT 1 FROM safety_system_migration ssm 
      WHERE ssm.old_safety_id = ss.id
    )
  LOOP
    BEGIN
      -- Find the appropriate device type
      SELECT * INTO device_type_rec
      FROM admin.device_types dt
      WHERE dt.device_class = 'safety' 
        AND dt.device_series = safety_rec.system_type;
      
      IF NOT FOUND THEN
        RAISE NOTICE 'Device type not found for system_type: %', safety_rec.system_type;
        error_count := error_count + 1;
        CONTINUE;
      END IF;
      
      -- Find or create parent device
      SELECT * INTO parent_device_rec
      FROM parent_devices pd
      WHERE pd.esp_id = safety_rec.system_id;
      
      IF NOT FOUND THEN
        -- Create parent device if it doesn't exist
        INSERT INTO parent_devices (esp_id, owner_account, status, is_demo)
        VALUES (safety_rec.system_id, safety_rec.user_id, 'active', true)
        RETURNING * INTO parent_device_rec;
      END IF;
      
      -- Create child device with safety system data
      INSERT INTO child_devices (
        parent_id,
        device_type_id,
        device_name,
        state,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        parent_device_rec.id,
        device_type_rec.id,
        safety_rec.system_id,
        jsonb_build_object(
          'room_name', safety_rec.room_name,
          'status', COALESCE(safety_rec.status, 'safe'),
          'flame_status', COALESCE(safety_rec.flame_status, 'clear'),
          'temperature', COALESCE(safety_rec.temperature_value, 25),
          'smoke_percentage', COALESCE(safety_rec.smoke_percentage, 0),
          'last_triggered', safety_rec.last_triggered,
          'sensor_readings', COALESCE(safety_rec.sensor_readings, '{}'),
          'automation_settings', COALESCE(safety_rec.automation_settings, '{}')
        ),
        safety_rec.user_id,
        safety_rec.created_at,
        safety_rec.updated_at
      );
      
      -- Record the migration
      INSERT INTO safety_system_migration (old_safety_id, new_child_id)
      VALUES (safety_rec.id, (SELECT id FROM child_devices WHERE parent_id = parent_device_rec.id AND device_type_id = device_type_rec.id ORDER BY created_at DESC LIMIT 1));
      
      result_count := result_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error migrating safety system %: %', safety_rec.id, SQLERRM;
      error_count := error_count + 1;
    END;
  END LOOP;
  
  migration_results := jsonb_build_object(
    'migrated_count', result_count,
    'error_count', error_count,
    'success', true
  );
  
  RETURN migration_results;
END;
$$;

-- Run the migration
SELECT migrate_safety_systems_to_child_devices();

-- Phase 2: Ensure device types exist for all safety system types
INSERT INTO admin.device_types (device_class, device_series, actions) 
VALUES 
  ('safety', 'fire_detection', '["suppress", "alarm", "evacuate"]'::jsonb),
  ('safety', 'rain_detection', '["open_windows", "close_windows", "drain"]'::jsonb),
  ('safety', 'gas_leak', '["ventilate", "shut_off_gas", "evacuate"]'::jsonb),
  ('safety', 'water_overflow', '["pump_water", "shut_off_water", "drain"]'::jsonb)
ON CONFLICT (device_class, device_series) DO NOTHING;

-- Enable realtime for child_devices table
ALTER TABLE child_devices REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE child_devices;