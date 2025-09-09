import { supabase } from '@/integrations/supabase/client';

export interface PowerSystem {
  id?: string;
  system_id: string;
  provider: string;
  system_type: 'solar' | 'grid';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class PowerSystemService {
  static async validateSystemId(systemId: string): Promise<PowerSystem | null> {
    try {
      const { data, error } = await supabase
        .from('power_systems')
        .select('*')
        .eq('system_id', systemId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error validating system ID:', error);
        return null;
      }

      return data as PowerSystem;
    } catch (error) {
      console.error('Error validating system ID:', error);
      return null;
    }
  }

  static async list(systemType?: 'solar' | 'grid'): Promise<PowerSystem[]> {
    try {
      let query = supabase
        .from('power_systems')
        .select('*')
        .eq('is_active', true);

      if (systemType) {
        query = query.eq('system_type', systemType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PowerSystem[];
    } catch (error) {
      console.error('Error fetching power systems:', error);
      return [];
    }
  }
}

export const PowerSystem = PowerSystemService;