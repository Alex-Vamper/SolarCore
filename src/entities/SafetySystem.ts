import { supabase } from '@/integrations/supabase/client';

export interface SafetySystem {
  id?: string;
  user_id?: string;
  system_id: string;
  system_type: 'fire_detection' | 'window_rain' | 'gas_leak' | 'water_overflow';
  room_name: string;
  status?: 'safe' | 'alert' | 'active' | 'suppression_active';
  sensor_readings?: {
    flame_detected?: boolean;
    smoke_level?: number;
    temperature?: number;
    rain_detected?: boolean;
    window_status?: 'open' | 'closed';
    gas_level?: number;
    water_level?: number;
  };
  last_triggered?: string;
  automation_settings?: {
    auto_response_enabled?: boolean;
    notification_level?: 'all' | 'critical_only' | 'none';
    trigger_threshold?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export class SafetySystemService {
  static async filter(params: { created_by?: string }): Promise<SafetySystem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('safety_systems')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching safety systems:', error);
      return [];
    }
  }

  static async create(safetySystem: SafetySystem): Promise<SafetySystem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('safety_systems')
        .insert({ ...safetySystem, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating safety system:', error);
      throw error;
    }
  }

  static async update(id: string, safetySystem: Partial<SafetySystem>): Promise<SafetySystem> {
    try {
      const { data, error } = await supabase
        .from('safety_systems')
        .update(safetySystem)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating safety system:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('safety_systems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting safety system:', error);
      throw error;
    }
  }
}

// Keep backward compatibility
export const SafetySystem = SafetySystemService;
