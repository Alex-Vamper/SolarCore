{
  "name": "VoiceCommand",
  "type": "object",
  "properties": {
    "command_category": {
      "type": "string",
      "enum": [
        "system_control",
        "lighting_control",
        "safety_security",
        "energy_management",
        "information_interaction"
      ],
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
      "description": "Type of action to perform (for future automation)"
    }
  },
  "required": [
    "command_category",
    "command_name",
    "keywords",
    "response"
  ]
}