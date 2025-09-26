-- Add device_class field to child_devices for faster MQTT access
ALTER TABLE child_devices ADD COLUMN device_class text;
ALTER TABLE child_devices ADD COLUMN device_series text;

-- Update existing records with device_class and device_series from device_types
UPDATE child_devices 
SET device_class = dt.device_class,
    device_series = dt.device_series
FROM admin.device_types dt
WHERE child_devices.device_type_id = dt.id;

-- Create function to automatically update device_class and device_series when device_type_id changes
CREATE OR REPLACE FUNCTION sync_child_device_type_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Get device_class and device_series from device_types
  SELECT device_class, device_series INTO NEW.device_class, NEW.device_series
  FROM admin.device_types
  WHERE id = NEW.device_type_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update device_class and device_series
DROP TRIGGER IF EXISTS sync_child_device_type_info_trigger ON child_devices;
CREATE TRIGGER sync_child_device_type_info_trigger
  BEFORE INSERT OR UPDATE OF device_type_id ON child_devices
  FOR EACH ROW
  EXECUTE FUNCTION sync_child_device_type_info();

-- Create function to send MQTT configuration when child device is created or updated
CREATE OR REPLACE FUNCTION send_mqtt_device_configuration()
RETURNS TRIGGER AS $$
DECLARE
  v_esp_id text;
BEGIN
  -- Get ESP ID from parent device
  SELECT esp_id INTO v_esp_id
  FROM parent_devices
  WHERE id = NEW.parent_id;
  
  -- Call MQTT bridge function to send configuration
  PERFORM pg_notify('mqtt_device_config', json_build_object(
    'action', 'send_device_configuration',
    'esp_id', v_esp_id,
    'child_id', NEW.id,
    'device_name', NEW.device_name,
    'device_class', NEW.device_class,
    'device_series', NEW.device_series,
    'state', NEW.state
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send MQTT configuration on device changes
DROP TRIGGER IF EXISTS mqtt_device_config_trigger ON child_devices;
CREATE TRIGGER mqtt_device_config_trigger
  AFTER INSERT OR UPDATE ON child_devices
  FOR EACH ROW
  EXECUTE FUNCTION send_mqtt_device_configuration();

-- Create function to send MQTT state updates when device state changes
CREATE OR REPLACE FUNCTION send_mqtt_state_update()
RETURNS TRIGGER AS $$
DECLARE
  v_esp_id text;
BEGIN
  -- Only send if state actually changed
  IF OLD.state IS DISTINCT FROM NEW.state THEN
    -- Get ESP ID from parent device
    SELECT esp_id INTO v_esp_id
    FROM parent_devices
    WHERE id = NEW.parent_id;
    
    -- Call MQTT bridge function to send state update
    PERFORM pg_notify('mqtt_state_update', json_build_object(
      'action', 'publish_command',
      'esp_id', v_esp_id,
      'child_id', NEW.id,
      'device_class', NEW.device_class,
      'device_series', NEW.device_series,
      'new_state', NEW.state
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send MQTT state updates
DROP TRIGGER IF EXISTS mqtt_state_update_trigger ON child_devices;
CREATE TRIGGER mqtt_state_update_trigger
  AFTER UPDATE ON child_devices
  FOR EACH ROW
  EXECUTE FUNCTION send_mqtt_state_update();