import { supabase } from '@/integrations/supabase/client';

export interface EnergySystem {
  id?: string;
  user_id?: string;
  energy_source?: 'solar' | 'grid' | 'mixed';
  solar_percentage?: number;
  grid_percentage?: number;
  battery_level?: number;
  current_usage?: number;
  daily_usage?: number;
  cost_savings?: number;
  created_at?: string;
  updated_at?: string;
}

export class EnergySystemService {
  static async filter(params: { created_by?: string }): Promise<EnergySystem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('energy_systems')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching energy systems:', error);
      return [];
    }
  }

  static async create(energySystem: EnergySystem): Promise<EnergySystem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('energy_systems')
        .insert({ ...energySystem, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating energy system:', error);
      throw error;
    }
  }

  static async update(id: string, energySystem: Partial<EnergySystem>): Promise<EnergySystem> {
    try {
      const { data, error } = await supabase
        .from('energy_systems')
        .update(energySystem)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating energy system:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('energy_systems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting energy system:', error);
      throw error;
    }
  }
}

// Keep backward compatibility
export const EnergySystem = EnergySystemService;
