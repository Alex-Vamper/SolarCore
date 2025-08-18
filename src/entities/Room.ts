{
  "name": "Room",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Room name (e.g., Living Room, Bedroom)"
    },
    "appliances": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Internal unique identifier for the device"
          },
          "name": {
            "type": "string",
            "description": "User-defined name for the device"
          },
          "type": {
            "type": "string",
            "enum": [
              "smart_lighting",
              "smart_hvac",
              "smart_shading",
              "smart_socket",
              "smart_camera",
              "motion_sensor",
              "air_quality"
            ],
            "description": "Category of the smart device"
          },
          "series": {
            "type": "string",
            "description": "The specific product series of the device"
          },
          "device_id": {
            "type": "string",
            "description": "The hardware ID of the device"
          },
          "status": {
            "type": "boolean",
            "default": false,
            "description": "Whether the device is on/off"
          },
          "power_usage": {
            "type": "number",
            "description": "Power consumption in watts"
          },
          "intensity": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "default": 50,
            "description": "Light intensity percentage (for lighting devices)"
          },
          "color_tint": {
            "type": "string",
            "enum": [
              "white",
              "warm",
              "cool"
            ],
            "default": "white",
            "description": "Color tint setting (for lighting devices)"
          },
          "auto_mode": {
            "type": "boolean",
            "default": true,
            "description": "Whether LDR auto-activation is enabled (for lighting devices)"
          },
          "ldr_status": {
            "type": "string",
            "enum": [
              "bright",
              "dim",
              "dark"
            ],
            "default": "bright",
            "description": "Current light sensor reading (for lighting devices)"
          }
        }
      }
    },
    "dome_count": {
      "type": "number",
      "default": 0,
      "description": "Number of solar domes in this room"
    },
    "occupancy_status": {
      "type": "boolean",
      "default": false,
      "description": "Whether room is currently occupied"
    },
    "pir_sensor_id": {
      "type": "string",
      "description": "Hardware ID for the PIR motion sensor"
    },
    "automation_settings": {
      "type": "object",
      "properties": {
        "auto_mode": {
          "type": "boolean",
          "default": false
        },
        "temperature_threshold_high": {
          "type": "number",
          "default": 28
        },
        "temperature_threshold_low": {
          "type": "number",
          "default": 20
        },
        "schedule": {
          "type": "object",
          "properties": {
            "morning_on": {
              "type": "string",
              "format": "time"
            },
            "evening_off": {
              "type": "string",
              "format": "time"
            }
          }
        }
      }
    },
    "order": {
      "type": "number",
      "default": 0,
      "description": "Used for drag-and-drop ordering of rooms"
    }
  },
  "required": [
    "name"
  ]
}