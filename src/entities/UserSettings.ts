import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface UserSettings {
  id?: string;
  user_id?: string;
  building_name?: string;
  building_type?: 'home' | 'school' | 'office' | 'hospital' | 'other';
  ander_enabled?: boolean;
  voice_response_enabled?: boolean;
  energy_mode?: string;
  security_level?: string;
  notification_preferences?: any;
  timezone?: string;
  theme_preference?: string;
  language?: string;
  address?: string;
  contact_phone?: string;
  emergency_contacts?: any;
  safety_notifications?: boolean;
  energy_alerts?: boolean;
  weekly_reports?: boolean;
  setup_completed?: boolean;
  total_rooms?: number;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  stripe_customer_id?: string;
  ander_device_id?: string;
  ander_button_position?: any;
  created_at?: string;
  updated_at?: string;
}

export class UserSettingsService {
  static async filter(params?: any): Promise<UserSettings[]> {
    return this.list();
  }

  static async upsert(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          ...settings,
          user_id: user.id,
          notification_preferences: settings.notification_preferences as Json,
          emergency_contacts: settings.emergency_contacts as Json,
          ander_button_position: settings.ander_button_position as Json
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        building_type: data.building_type as "home" | "school" | "office" | "hospital" | "other",
        notification_preferences: typeof (data as any).notification_preferences === 'object' ? (data as any).notification_preferences : {},
        emergency_contacts: typeof (data as any).emergency_contacts === 'object' ? (data as any).emergency_contacts : {},
        ander_button_position: typeof (data as any).ander_button_position === 'object' ? (data as any).ander_button_position : { x: 20, y: 20 }
      };
    } catch (error) {
      console.error('Error upserting user settings:', error);
      throw error;
    }
  }

  static async list(): Promise<UserSettings[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        building_type: item.building_type as "home" | "school" | "office" | "hospital" | "other",
        notification_preferences: typeof (item as any).notification_preferences === 'object' ? (item as any).notification_preferences : {},
        emergency_contacts: typeof (item as any).emergency_contacts === 'object' ? (item as any).emergency_contacts : {}
      }));
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
        .insert({
          ...settings,
          user_id: user.id,
          notification_preferences: settings.notification_preferences as Json,
          emergency_contacts: settings.emergency_contacts as Json
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        building_type: data.building_type as "home" | "school" | "office" | "hospital" | "other",
        notification_preferences: typeof (data as any).notification_preferences === 'object' ? (data as any).notification_preferences : {},
        emergency_contacts: typeof (data as any).emergency_contacts === 'object' ? (data as any).emergency_contacts : {},
        ander_button_position: typeof (data as any).ander_button_position === 'object' ? (data as any).ander_button_position : { x: 20, y: 20 }
      };
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  }

  static async update(id: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const updateData: any = { ...settings };
      if (settings.notification_preferences) {
        updateData.notification_preferences = settings.notification_preferences as Json;
      }
      if (settings.emergency_contacts) {
        updateData.emergency_contacts = settings.emergency_contacts as Json;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        building_type: data.building_type as "home" | "school" | "office" | "hospital" | "other",
        notification_preferences: typeof (data as any).notification_preferences === 'object' ? (data as any).notification_preferences : {},
        emergency_contacts: typeof (data as any).emergency_contacts === 'object' ? (data as any).emergency_contacts : {},
        ander_button_position: typeof (data as any).ander_button_position === 'object' ? (data as any).ander_button_position : { x: 20, y: 20 }
      };
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user settings:', error);
      throw error;
    }
  }
}

// Keep backward compatibility
export const UserSettings = UserSettingsService;