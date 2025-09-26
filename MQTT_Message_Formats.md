# MQTT Message Formats for SolarCore Hardware Integration

## MQTT Broker Configuration
- **Broker**: test.mosquitto.org
- **WebSocket Port**: 8081 
- **Protocol**: WSS (WebSocket Secure)

## Topic Structure

### App → Hardware (Commands)
- **Topic**: `esp/{ESP_ID}/commands`
- **Topic**: `esp/{ESP_ID}/config` 
- **Topic**: `esp/{ESP_ID}/wifi-config`

### Hardware → App (Status/State Updates)
- **Topic**: `esp/{ESP_ID}/status`
- **Topic**: `esp/{ESP_ID}/state`

## Message Formats

### 1. Device State Commands (App → Hardware)
**Topic**: `esp/{ESP_ID}/commands`
```json
{
  "message_id": "uuid-string",
  "timestamp": "2025-09-26T20:57:00.000Z",
  "target": {
    "child_id": "uuid-of-child-device",
    "device_class": "lighting|safety|energy|automation",
    "device_series": "specific-device-model"
  },
  "action": "set_state",
  "payload": {
    "status": "on|off",
    "intensity": 75,
    "color_tint": "#ffffff",
    "temperature": 25.5
  }
}
```

### 2. Device Configuration (App → Hardware)
**Topic**: `esp/{ESP_ID}/config`
```json
{
  "message_id": "uuid-string", 
  "timestamp": "2025-09-26T20:57:00.000Z",
  "action": "configure_device",
  "payload": {
    "child_id": "uuid-of-child-device",
    "device_name": "Living Room Light",
    "device_class": "lighting",
    "device_series": "SC-LED-001"
  }
}
```

### 3. Device Sync (App → Hardware)
**Topic**: `esp/{ESP_ID}/config`
```json
{
  "message_id": "uuid-string",
  "timestamp": "2025-09-26T20:57:00.000Z", 
  "action": "sync_all_devices",
  "payload": {
    "devices": [
      {
        "child_id": "uuid-1",
        "device_name": "Living Room Light",
        "device_class": "lighting",
        "device_series": "SC-LED-001",
        "current_state": {
          "status": "on",
          "intensity": 75
        }
      },
      {
        "child_id": "uuid-2", 
        "device_name": "Smoke Detector",
        "device_class": "safety",
        "device_series": "SC-SMOKE-001",
        "current_state": {
          "status": "safe",
          "smoke_percentage": 0
        }
      }
    ]
  }
}
```

### 4. WiFi Configuration (App → Hardware)
**Topic**: `esp/{ESP_ID}/wifi-config`
```json
{
  "message_id": "uuid-string",
  "timestamp": "2025-09-26T20:57:00.000Z",
  "action": "configure_wifi", 
  "payload": {
    "networks": [
      {
        "ssid": "Home_WiFi",
        "password": "wifi-password",
        "priority": 0
      },
      {
        "ssid": "Backup_WiFi",
        "password": "backup-password", 
        "priority": 1
      }
    ]
  }
}
```

### 5. Hardware Status Updates (Hardware → App)
**Topic**: `esp/{ESP_ID}/status`
```json
{
  "esp_id": "SC-GID-0001",
  "timestamp": "2025-09-26T20:57:00.000Z",
  "status": "online|offline|rebooting",
  "uptime": 12345,
  "free_memory": 45000,
  "wifi_rssi": -45,
  "version": "1.0.0"
}
```

### 6. Device State Updates (Hardware → App)
**Topic**: `esp/{ESP_ID}/state`
```json
{
  "esp_id": "SC-GID-0001",
  "child_id": "uuid-of-child-device",
  "timestamp": "2025-09-26T20:57:00.000Z",
  "device_class": "lighting",
  "device_series": "SC-LED-001", 
  "state": {
    "status": "on",
    "intensity": 80,
    "color_tint": "#ff0000",
    "temperature": 26.2
  }
}
```

## Hardware Implementation Guidelines

### ESP32 Subscription Topics
Your ESP32 should subscribe to:
- `esp/{your_esp_id}/commands`
- `esp/{your_esp_id}/config`
- `esp/{your_esp_id}/wifi-config`

### ESP32 Publishing Topics
Your ESP32 should publish to:
- `esp/{your_esp_id}/status` (every 30 seconds)
- `esp/{your_esp_id}/state` (when device state changes)

### Device Registration Flow
1. ESP32 boots and publishes status message
2. App calls `/functions/mqtt-bridge` with action `register_esp_device`
3. App calls `/functions/mqtt-bridge` with action `get_esp_sync_data` 
4. Backend publishes sync message to `esp/{ESP_ID}/config`
5. ESP32 receives and applies all device configurations

### Error Handling
Always include error responses in your hardware messages:
```json
{
  "esp_id": "SC-GID-0001",
  "timestamp": "2025-09-26T20:57:00.000Z",
  "error": "unknown_device",
  "message": "Child device UUID not found"
}
```