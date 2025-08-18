// Mock EnergySystem entity for SolarCore
export class EnergySystem {
  id: string;
  created_by: string;
  energy_source: string;
  solar_percentage: number;
  grid_percentage: number;
  battery_level: number;
  current_usage: number;
  daily_usage: number;
  cost_savings: number;

  constructor(data: any) {
    this.id = data.id;
    this.created_by = data.created_by;
    this.energy_source = data.energy_source;
    this.solar_percentage = data.solar_percentage;
    this.grid_percentage = data.grid_percentage;
    this.battery_level = data.battery_level;
    this.current_usage = data.current_usage;
    this.daily_usage = data.daily_usage;
    this.cost_savings = data.cost_savings;
  }

  static async filter(criteria: any): Promise<EnergySystem[]> {
    const mockEnergy = localStorage.getItem('solarcore_energy_system');
    if (mockEnergy) {
      return [new EnergySystem(JSON.parse(mockEnergy))];
    }
    return [];
  }

  static async create(data: any): Promise<EnergySystem> {
    const energy = new EnergySystem({
      id: Date.now().toString(),
      created_by: "user@solarcore.com",
      ...data
    });
    localStorage.setItem('solarcore_energy_system', JSON.stringify(energy));
    return energy;
  }
}