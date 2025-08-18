{
  "name": "UserSettings",
  "type": "object",
  "properties": {
    "setup_completed": {
      "type": "boolean",
      "default": false,
      "description": "Whether initial setup is complete"
    },
    "building_type": {
      "type": "string",
      "enum": [
        "home",
        "school",
        "office",
        "hospital",
        "other"
      ],
      "default": "home"
    },
    "building_name": {
      "type": "string"
    },
    "total_rooms": {
      "type": "number",
      "default": 0,
      "description": "Total number of rooms in the home"
    },
    "total_domes": {
      "type": "number",
      "default": 0,
      "description": "Total number of solar domes"
    },
    "energy_mode": {
      "type": "string",
      "enum": [
        "solar_only",
        "grid_only",
        "auto_switch"
      ],
      "default": "auto_switch",
      "description": "Energy management mode"
    },
    "notifications_enabled": {
      "type": "boolean",
      "default": true,
      "description": "Whether push notifications are enabled"
    },
    "voice_response_enabled": {
      "type": "boolean",
      "default": true,
      "description": "Whether voice responses from Ander are enabled"
    },
    "ander_enabled": {
      "type": "boolean",
      "default": true,
      "description": "Whether the Ander AI assistant is enabled globally"
    },
    "preferred_email": {
      "type": "string"
    },
    "preferred_email_enabled": {
      "type": "boolean",
      "default": true
    },
    "preferred_whatsapp": {
      "type": "string"
    },
    "preferred_whatsapp_enabled": {
      "type": "boolean",
      "default": true
    },
    "emergency_contacts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          }
        }
      }
    },
    "contact_phone": {
      "type": "string"
    },
    "address": {
      "type": "string"
    },
    "security_settings": {
      "type": "object",
      "properties": {
        "auto_shutdown_enabled": {
          "type": "boolean",
          "default": false
        },
        "shutdown_exceptions": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of appliance IDs to keep on"
        }
      }
    }
  },
  "required": []
}