// Mock User entity for SolarCore
export class User {
  id: string;
  email: string;
  full_name: string;
  created_date: string;

  constructor(data: any) {
    this.id = data.id;
    this.email = data.email;
    this.full_name = data.full_name;
    this.created_date = data.created_date;
  }

  static async me(): Promise<User> {
    // Mock implementation - replace with actual API call
    return new User({
      id: "1",
      email: "user@solarcore.com",
      full_name: "John Smith",
      created_date: new Date().toISOString()
    });
  }
}