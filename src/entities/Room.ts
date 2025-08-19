import { supabase } from '@/integrations/supabase/client';

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
      return data?.map(room => ({
        ...room,
        order: room.order_index
      })) || [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  }

  static async create(room: Room): Promise<Room> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          ...room,
          user_id: user.id,
          order_index: room.order || 0
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        order: data.order_index
      };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  static async update(id: string, room: Partial<Room>): Promise<Room> {
    try {
      const updateData = { ...room };
      if (room.order !== undefined) {
        updateData.order_index = room.order;
        delete updateData.order;
      }

      const { data, error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        order: data.order_index
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