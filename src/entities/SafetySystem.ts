{
  "name": "SafetySystem",
  "type": "object",
  "properties": {
    "system_id": {
      "type": "string",
      "description": "Unique hardware identifier for the system"
    },
    "system_type": {
      "type": "string",
      "enum": [
        "fire_detection",
        "window_rain",
        "gas_leak",
        "water_overflow"
      ],
      "description": "Type of safety system"
    },
    "room_name": {
      "type": "string",
      "description": "Associated room name"
    },
    "status": {
      "type": "string",
      "enum": [
        "safe",
        "alert",
        "active",
        "suppression_active"
      ],
      "default": "safe",
      "description": "Current system status"
    },
    "sensor_readings": {
      "type": "object",
      "properties": {
        "flame_detected": {
          "type": "boolean",
          "default": false
        },
        "smoke_level": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "default": 0
        },
        "temperature": {
          "type": "number",
          "default": 25
        },
        "rain_detected": {
          "type": "boolean",
          "default": false
        },
        "window_status": {
          "type": "string",
          "enum": [
            "open",
            "closed"
          ],
          "default": "closed"
        },
        "gas_level": {
          "type": "number",
          "default": 0,
          "description": "Gas concentration in ppm"
        },
        "water_level": {
          "type": "number",
          "default": 0,
          "description": "Water tank level percentage"
        }
      }
    },
    "last_triggered": {
      "type": "string",
      "format": "date-time",
      "description": "Last time the system was triggered"
    },
    "automation_settings": {
      "type": "object",
      "properties": {
        "auto_response_enabled": {
          "type": "boolean",
          "default": true
        },
        "notification_level": {
          "type": "string",
          "enum": [
            "all",
            "critical_only",
            "none"
          ],
          "default": "all"
        },
        "trigger_threshold": {
          "type": "number",
          "default": 75,
          "description": "Sensor level to trigger alert (e.g., smoke %)"
        }
      }
    }
  },
  "required": [
    "system_id",
    "system_type",
    "room_name"
  ]
}