{
  "name": "VoiceCommand",
  "type": "object",
  "properties": {
    "command_category": {
      "type": "string",
      "description": "Category of the voice command"
    },
    "command_name": {
      "type": "string",
      "description": "Internal name for the command"
    },
    "keywords": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of possible phrases user might say"
    },
    "response": {
      "type": "string",
      "description": "Text response Ander should give"
    },
    "action_type": {
      "type": "string",
      "description": "Type of action to perform"
    },
    "audio_url": {
      "type": "string",
      "description": "URL to pre-recorded audio response file"
    },
    "target_room_id": {
      "type": "string",
      "description": "ID of the target Room entity for a device-specific command"
    },
    "target_appliance_id": {
      "type": "string",
      "description": "ID of the target appliance within the room"
    },
    "target_state_key": {
      "type": "string",
      "description": "The property key of the appliance to change (e.g., 'status')"
    },
    "target_state_value": {
      "type": "string",
      "description": "The value to set for the target state key (e.g., 'true' or 'false')"
    }
  },
  "required": [
    "command_category",
    "command_name",
    "keywords",
    "response"
  ]
}