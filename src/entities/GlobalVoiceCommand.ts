import { supabase } from '@/integrations/supabase/client';

export interface GlobalVoiceCommand {
  id: string;
  command_category: string;
  command_name: string;
  command_text: string;
  keywords: string[];
  response_text: string;
  audio_url?: string;
  action_type?: string;
  is_active: boolean;
}

export class GlobalVoiceCommandService {
  private static commandCache: GlobalVoiceCommand[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async list(): Promise<GlobalVoiceCommand[]> {
    // Use cached commands if available and not expired
    if (this.commandCache && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.commandCache;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch global commands from admin_ander_commands
      const { data, error } = await supabase
        .from('admin_ander_commands')
        .select('*')
        .eq('is_active', true)
        .order('command_category', { ascending: true })
        .order('command_name', { ascending: true });

      if (error) throw error;
      
      // Cache the commands
      this.commandCache = data || [];
      this.cacheTimestamp = Date.now();
      
      return this.commandCache;
    } catch (error) {
      console.error('Error fetching global voice commands:', error);
      return [];
    }
  }

  static async updateAudioUrl(commandId: string, audioUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_ander_commands')
        .update({ audio_url: audioUrl })
        .eq('id', commandId);

      if (error) throw error;
      
      // Clear cache after update
      this.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error updating audio URL:', error);
      return false;
    }
  }

  static clearCache() {
    this.commandCache = null;
    this.cacheTimestamp = 0;
  }
}

// Keep backward compatibility
export const GlobalVoiceCommand = GlobalVoiceCommandService;
