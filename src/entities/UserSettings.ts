import { supabase } from '@/integrations/supabase/client';

export interface UserSettings {
  id?: string;
  user_id?: string;
  setup_completed?: boolean;
  building_type?: 'home' | 'school' | 'office' | 'hospital' | 'other';
  building_name?: string;
  total_rooms?: number;
  total_domes?: number;
  energy_mode?: 'solar_only' | 'grid_only' | 'auto_switch';
  notifications_enabled?: boolean;
  voice_response_enabled?: boolean;
  ander_enabled?: boolean;
  preferred_email?: string;
  preferred_email_enabled?: boolean;
  preferred_whatsapp?: string;
  preferred_whatsapp_enabled?: boolean;
  emergency_contacts?: Array<{ name: string; phone: string }>;
  contact_phone?: string;
  address?: string;
  security_settings?: {
    auto_shutdown_enabled?: boolean;
    shutdown_exceptions?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export class UserSettingsService {
  static async filter(params: { created_by?: string }): Promise<UserSettings[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return [];
    }
  }

  static async create(settings: UserSettings): Promise<UserSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_settings')
        .insert({ ...settings, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  }

  static async update(id: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }
}

// Keep backward compatibility
export const UserSettings = UserSettingsService;
