import { supabase } from '@/integrations/supabase/client';

export interface VoiceCommand {
  id?: string;
  user_id?: string;
  command_category: string;
  command_name: string;
  keywords: string[];
  response: string;
  action_type?: string;
  audio_url?: string;
  is_global?: boolean;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class VoiceCommandService {
  static async filter(params?: any): Promise<VoiceCommand[]> {
    return this.list();
  }

  static async list(): Promise<VoiceCommand[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('voice_commands')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching voice commands:', error);
      return [];
    }
  }

  static async create(command: VoiceCommand): Promise<VoiceCommand> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('voice_commands')
        .insert({ ...command, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating voice command:', error);
      throw error;
    }
  }

  static async bulkCreate(commands: VoiceCommand[]): Promise<VoiceCommand[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const commandsWithUser = commands.map(cmd => ({ ...cmd, user_id: user.id }));
      
      const { data, error } = await supabase
        .from('voice_commands')
        .insert(commandsWithUser)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk creating voice commands:', error);
      throw error;
    }
  }

  static async update(id: string, command: Partial<VoiceCommand>): Promise<VoiceCommand> {
    try {
      const { data, error } = await supabase
        .from('voice_commands')
        .update(command)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating voice command:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('voice_commands')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting voice command:', error);
      throw error;
    }
  }

  static async deleteAll(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('voice_commands')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting all voice commands:', error);
      throw error;
    }
  }
}

// Keep backward compatibility
export const VoiceCommand = VoiceCommandService;
