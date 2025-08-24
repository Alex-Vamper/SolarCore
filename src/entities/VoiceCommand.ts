import { supabase } from "@/integrations/supabase/client";

export interface VoiceCommand {
  id?: string;
  user_id?: string;
  command_category: 'system_control' | 'lighting_control' | 'shading_control' | 'hvac_control' | 'socket_control' | 'safety_security' | 'energy_management' | 'information_interaction';
  command_name: string;
  keywords: string[];
  response: string;
  action_type?: string;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class VoiceCommandService {
  static async list(): Promise<VoiceCommand[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('voice_commands')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('created_at');

      if (error) throw error;
      return (data || []) as VoiceCommand[];
    } catch (error) {
      console.error('Error fetching voice commands:', error);
      return this.getDefaultCommands();
    }
  }

  static async bulkCreate(commands: VoiceCommand[]): Promise<VoiceCommand[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const commandsWithUser = commands.map(cmd => ({
        ...cmd,
        user_id: user.id
      }));

      const { data, error } = await supabase
        .from('voice_commands')
        .insert(commandsWithUser)
        .select();

      if (error) throw error;
      return (data || []) as VoiceCommand[];
    } catch (error) {
      console.error('Error creating voice commands:', error);
      return commands;
    }
  }

  static async create(command: VoiceCommand): Promise<VoiceCommand | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('voice_commands')
        .insert({ ...command, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as VoiceCommand;
    } catch (error) {
      console.error('Error creating voice command:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<VoiceCommand>): Promise<VoiceCommand | null> {
    try {
      const { data, error } = await supabase
        .from('voice_commands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as VoiceCommand;
    } catch (error) {
      console.error('Error updating voice command:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('voice_commands')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting voice command:', error);
      return false;
    }
  }

  static getDefaultCommands(): VoiceCommand[] {
    return [
      {
        command_category: 'system_control',
        command_name: 'status_check',
        keywords: ['status', 'how is everything', 'system report'],
        response: 'All systems are operating normally. Energy is running efficiently and safety systems are active.',
        action_type: 'status_report'
      },
      {
        command_category: 'lighting_control',
        command_name: 'lights_on',
        keywords: ['turn on lights', 'lights on', 'illuminate'],
        response: 'Turning on the lights in the main areas.',
        action_type: 'lighting_control'
      },
      {
        command_category: 'energy_management',
        command_name: 'energy_report',
        keywords: ['energy usage', 'power consumption', 'battery level'],
        response: 'Current energy usage is optimal. Solar panels are generating efficiently.',
        action_type: 'energy_report'
      }
    ];
  }
}

// Keep backward compatibility
export const VoiceCommand = VoiceCommandService;