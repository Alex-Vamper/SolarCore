// Mock UserSettings entity for SolarCore
export class UserSettings {
  id: string;
  created_by: string;
  setup_completed: boolean;
  building_type: string;
  building_name: string;
  total_rooms: number;
  energy_mode: string;

  constructor(data: any) {
    this.id = data.id;
    this.created_by = data.created_by;
    this.setup_completed = data.setup_completed;
    this.building_type = data.building_type;
    this.building_name = data.building_name;
    this.total_rooms = data.total_rooms;
    this.energy_mode = data.energy_mode;
  }

  static async filter(criteria: any): Promise<UserSettings[]> {
    // Mock implementation - returns empty for first-time setup
    const mockSettings = localStorage.getItem('solarcore_user_settings');
    if (mockSettings) {
      return [new UserSettings(JSON.parse(mockSettings))];
    }
    return [];
  }

  static async create(data: any): Promise<UserSettings> {
    const settings = new UserSettings({
      id: Date.now().toString(),
      created_by: "user@solarcore.com",
      ...data
    });
    localStorage.setItem('solarcore_user_settings', JSON.stringify(settings));
    return settings;
  }
}