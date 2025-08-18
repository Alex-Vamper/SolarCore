// Mock SafetySystem entity for SolarCore
export class SafetySystem {
  id: string;
  created_by: string;
  type: string;
  status: string;
  location: string;
  last_checked: string;

  constructor(data: any) {
    this.id = data.id;
    this.created_by = data.created_by;
    this.type = data.type;
    this.status = data.status;
    this.location = data.location;
    this.last_checked = data.last_checked;
  }

  static async filter(criteria: any): Promise<SafetySystem[]> {
    const mockSafety = localStorage.getItem('solarcore_safety_systems');
    if (mockSafety) {
      return JSON.parse(mockSafety).map((item: any) => new SafetySystem(item));
    }
    // Return some default safety systems
    const defaultSafety = [
      {
        id: "1",
        created_by: "user@solarcore.com",
        type: "smoke_detector",
        status: "online",
        location: "Living Room",
        last_checked: new Date().toISOString()
      },
      {
        id: "2",
        created_by: "user@solarcore.com", 
        type: "security_camera",
        status: "online",
        location: "Front Door",
        last_checked: new Date().toISOString()
      }
    ];
    localStorage.setItem('solarcore_safety_systems', JSON.stringify(defaultSafety));
    return defaultSafety.map(item => new SafetySystem(item));
  }
}