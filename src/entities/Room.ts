// Mock Room entity for SolarCore
export class Room {
  id: string;
  created_by: string;
  name: string;
  appliances: any[];
  dome_count: number;
  occupancy_status: boolean;
  order: number;
  created_date: string;

  constructor(data: any) {
    this.id = data.id;
    this.created_by = data.created_by;
    this.name = data.name;
    this.appliances = data.appliances || [];
    this.dome_count = data.dome_count || 0;
    this.occupancy_status = data.occupancy_status || false;
    this.order = data.order || 0;
    this.created_date = data.created_date || new Date().toISOString();
  }

  static async filter(criteria: any, sortOrder?: string, limit?: number): Promise<Room[]> {
    const mockRooms = localStorage.getItem('solarcore_rooms');
    let rooms = [];
    
    if (mockRooms) {
      rooms = JSON.parse(mockRooms).map((item: any) => new Room(item));
    }

    if (sortOrder === '-created_date') {
      rooms.sort((a: Room, b: Room) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    }

    if (limit) {
      rooms = rooms.slice(0, limit);
    }

    return rooms;
  }

  static async create(data: any): Promise<Room> {
    const room = new Room({
      id: Date.now().toString() + Math.random(),
      created_by: "user@solarcore.com",
      created_date: new Date().toISOString(),
      ...data
    });
    
    const existingRooms = await this.filter({});
    const allRooms = [...existingRooms, room];
    localStorage.setItem('solarcore_rooms', JSON.stringify(allRooms));
    
    return room;
  }

  static async update(id: string, data: any): Promise<Room> {
    const rooms = await this.filter({});
    const index = rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...data };
      localStorage.setItem('solarcore_rooms', JSON.stringify(rooms));
      return rooms[index];
    }
    throw new Error('Room not found');
  }
}