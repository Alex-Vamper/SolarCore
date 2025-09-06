import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface SafetySystem {
  id?: string;
  user_id?: string;
  system_id: string;
  system_type: 'fire_detection' | 'window_rain' | 'gas_leak' | 'water_overflow';
  room_name: string;
  status?: string;
  flame_status?: string;  // For fire detection: 'clear' or 'flames'
  temperature_value?: number;  // Numerical temperature readings
  smoke_percentage?: number;  // 0-100 percentage for smoke level
  last_triggered?: string;
  sensor_readings?: any;
  automation_settings?: any;
  created_at?: string;
  updated_at?: string;
}

export class SafetySystemService {
  static async filter(params?: any): Promise<SafetySystem[]> {
    return this.list();
  }

  static async get(id: string): Promise<SafetySystem | null> {
    try {
      const { data, error } = await supabase
        .from('safety_systems')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        ...data,
        system_type: data.system_type as "fire_detection" | "window_rain" | "gas_leak" | "water_overflow"
      };
    } catch (error) {
      console.error('Error fetching safety system:', error);
      return null;
    }
  }

  static async list(): Promise<SafetySystem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('safety_systems')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        system_type: item.system_type as "fire_detection" | "window_rain" | "gas_leak" | "water_overflow",
        sensor_readings: typeof item.sensor_readings === 'object' ? item.sensor_readings : {},
        automation_settings: typeof item.automation_settings === 'object' ? item.automation_settings : {}
      })) || [];
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
        .insert({
          ...safetySystem,
          user_id: user.id,
          flame_status: safetySystem.flame_status || 'clear',
          temperature_value: safetySystem.temperature_value || 25,
          smoke_percentage: safetySystem.smoke_percentage || 0,
          sensor_readings: safetySystem.sensor_readings as Json,
          automation_settings: safetySystem.automation_settings as Json
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        system_type: data.system_type as "fire_detection" | "window_rain" | "gas_leak" | "water_overflow",
        sensor_readings: typeof data.sensor_readings === 'object' ? data.sensor_readings : {},
        automation_settings: typeof data.automation_settings === 'object' ? data.automation_settings : {}
      };
    } catch (error) {
      console.error('Error creating safety system:', error);
      throw error;
    }
  }

  static async update(id: string, safetySystem: Partial<SafetySystem>): Promise<SafetySystem> {
    try {
      const updateData: any = { ...safetySystem };
      if (safetySystem.sensor_readings) {
        updateData.sensor_readings = safetySystem.sensor_readings as Json;
      }
      if (safetySystem.automation_settings) {
        updateData.automation_settings = safetySystem.automation_settings as Json;
      }

      const { data, error } = await supabase
        .from('safety_systems')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        system_type: data.system_type as "fire_detection" | "window_rain" | "gas_leak" | "water_overflow",
        sensor_readings: typeof data.sensor_readings === 'object' ? data.sensor_readings : {},
        automation_settings: typeof data.automation_settings === 'object' ? data.automation_settings : {}
      };
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

  static async upsert(safetySystem: SafetySystem): Promise<SafetySystem> {
    if (safetySystem.id) {
      return this.update(safetySystem.id, safetySystem);
    } else {
      return this.create(safetySystem);
    }
  }
}

// Backwards compatibility
export const SafetySystem = SafetySystemService;