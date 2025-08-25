import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface Appliance {
  id: string;
  name: string;
  type: 'smart_lighting' | 'smart_hvac' | 'smart_shading' | 'smart_socket' | 'smart_camera' | 'motion_sensor' | 'air_quality';
  series?: string;
  device_id?: string;
  status?: boolean;
  power_usage?: number;
  intensity?: number;
  color_tint?: 'white' | 'warm' | 'cool';
  auto_mode?: boolean;
  ldr_status?: 'bright' | 'dim' | 'dark';
}

export interface Room {
  id?: string;
  user_id?: string;
  name: string;
  appliances?: Appliance[];
  dome_count?: number;
  occupancy_status?: boolean;
  pir_sensor_id?: string;
  automation_settings?: {
    auto_mode?: boolean;
    temperature_threshold_high?: number;
    temperature_threshold_low?: number;
    schedule?: {
      morning_on?: string;
      evening_off?: string;
    };
  };
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export class RoomService {
  static async list(): Promise<Room[]> {
    return this.filter({});
  }
  static async filter(params: { created_by?: string }, orderBy?: string, order?: string): Promise<Room[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('rooms')
        .select('*')
        .eq('user_id', user.id);

      if (orderBy) {
        query = query.order(orderBy === 'order' ? 'order_index' : orderBy, { ascending: order !== 'desc' });
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(room => ({
        id: room.id,
        user_id: room.user_id,
        name: room.name,
        appliances: Array.isArray(room.appliances) ? room.appliances as unknown as Appliance[] : [],
        dome_count: room.dome_count || 0,
        occupancy_status: room.occupancy_status || false,
        pir_sensor_id: room.pir_sensor_id || undefined,
        automation_settings: typeof room.automation_settings === 'object' ? room.automation_settings as any : undefined,
        order: room.order_index || 0,
        created_at: room.created_at || undefined,
        updated_at: room.updated_at || undefined
      }));
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  }

  static async get(id: string): Promise<Room | null> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        appliances: Array.isArray(data.appliances) ? data.appliances as unknown as Appliance[] : [],
        dome_count: data.dome_count || 0,
        occupancy_status: data.occupancy_status || false,
        pir_sensor_id: data.pir_sensor_id || undefined,
        automation_settings: typeof data.automation_settings === 'object' ? data.automation_settings as any : undefined,
        order: data.order_index || 0,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined
      };
    } catch (error) {
      console.error('Error fetching room:', error);
      return null;
    }
  }

  static async create(room: Room): Promise<Room> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: room.name,
          user_id: user.id,
          appliances: room.appliances as unknown as Json,
          dome_count: room.dome_count,
          occupancy_status: room.occupancy_status,
          pir_sensor_id: room.pir_sensor_id,
          automation_settings: room.automation_settings as Json,
          order_index: room.order || 0
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        appliances: Array.isArray(data.appliances) ? data.appliances as unknown as Appliance[] : [],
        dome_count: data.dome_count || 0,
        occupancy_status: data.occupancy_status || false,
        pir_sensor_id: data.pir_sensor_id || undefined,
        automation_settings: typeof data.automation_settings === 'object' ? data.automation_settings as any : undefined,
        order: data.order_index || 0,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined
      };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  static async update(id: string, room: Partial<Room>): Promise<Room> {
    try {
      const updateData: any = {};
      
      if (room.name !== undefined) updateData.name = room.name;
      if (room.appliances !== undefined) updateData.appliances = room.appliances as unknown as Json;
      if (room.dome_count !== undefined) updateData.dome_count = room.dome_count;
      if (room.occupancy_status !== undefined) updateData.occupancy_status = room.occupancy_status;
      if (room.pir_sensor_id !== undefined) updateData.pir_sensor_id = room.pir_sensor_id;
      if (room.automation_settings !== undefined) updateData.automation_settings = room.automation_settings as Json;
      if (room.order !== undefined) updateData.order_index = room.order;

      const { data, error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        appliances: Array.isArray(data.appliances) ? data.appliances as unknown as Appliance[] : [],
        dome_count: data.dome_count || 0,
        occupancy_status: data.occupancy_status || false,
        pir_sensor_id: data.pir_sensor_id || undefined,
        automation_settings: typeof data.automation_settings === 'object' ? data.automation_settings as any : undefined,
        order: data.order_index || 0,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined
      };
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }
}

// Keep backward compatibility
export const Room = RoomService;
