{
  "name": "EnergySystem",
  "type": "object",
  "properties": {
    "energy_source": {
      "type": "string",
      "enum": [
        "solar",
        "grid",
        "mixed"
      ],
      "default": "mixed",
      "description": "Primary energy source configuration"
    },
    "solar_percentage": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "default": 0,
      "description": "Current solar power percentage"
    },
    "grid_percentage": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "default": 100,
      "description": "Current grid power percentage"
    },
    "battery_level": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "default": 50,
      "description": "Battery charge percentage"
    },
    "current_usage": {
      "type": "number",
      "default": 0,
      "description": "Current energy usage in kWh"
    },
    "daily_usage": {
      "type": "number",
      "default": 0,
      "description": "Total daily energy usage in kWh"
    },
    "cost_savings": {
      "type": "number",
      "default": 0,
      "description": "Daily cost savings from solar in Naira"
    }
  },
  "required": []
}