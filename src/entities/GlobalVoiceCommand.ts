import { supabase } from '@/integrations/supabase/client';

export interface GlobalVoiceCommand {
  id: string;
  command_category: string;
  command_name: string;
  command_text: string;
  keywords: string[];
  response_text: string;
  audio_url?: string;
  audio_url_english?: string;
  audio_url_hausa?: string;
  audio_url_yoruba?: string;
  audio_url_igbo?: string;
  audio_url_pidgin?: string;
  action_type?: string;
  is_active: boolean;
}

export class GlobalVoiceCommandService {
  private static commandCache: GlobalVoiceCommand[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async list(userSettings?: any): Promise<GlobalVoiceCommand[]> {
    // Use cached commands if available and not expired
    if (this.commandCache && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.filterCommandsBySubscription(this.commandCache, userSettings);
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
      
      return this.filterCommandsBySubscription(this.commandCache, userSettings);
    } catch (error) {
      console.error('Error fetching global voice commands:', error);
      return [];
    }
  }

  private static filterCommandsBySubscription(commands: GlobalVoiceCommand[], userSettings?: any): GlobalVoiceCommand[] {
    // Always return all commands - filtering is now done during execution
    return commands;
  }

  static isCommandRestricted(command: GlobalVoiceCommand, userSettings?: any): boolean {
    if (!userSettings) return false;

    const subscriptionPlan = userSettings.subscription_plan || 'free';
    
    // Premium users can access all commands
    if (subscriptionPlan !== 'free') return false;
    
    // Free plan restrictions
    if (subscriptionPlan === 'free') {
      // Block all energy_management commands
      if (command.command_category === 'energy_management') return true;
      
      // Block all safety_and_security commands except lock_front_door
      if (command.command_category === 'safety_and_security' && command.command_name !== 'lock_front_door') {
        return true;
      }
      
      // Block specific device socket commands (socket_specific_* action types)
      if (command.action_type?.includes('socket_specific')) return true;
      
      // Block specific device commands based on keywords
      const cmdName = command.command_name.toLowerCase();
      const keywords = command.keywords?.join(' ').toLowerCase() || '';
      
      // Block specific device commands (tv socket, dispenser socket, free socket)
      const isSpecificDevice = [
        'tv socket', 'dispenser socket', 'free socket'
      ].some(specific => cmdName.includes(specific) || keywords.includes(specific));
      
      return isSpecificDevice;
    }
    
    return false;
  }

  static getAudioUrlForLanguage(command: GlobalVoiceCommand, language: string = 'english'): string | undefined {
    const languageMap = {
      'english': command.audio_url_english || command.audio_url,
      'hausa': command.audio_url_hausa || command.audio_url_english || command.audio_url,
      'yoruba': command.audio_url_yoruba || command.audio_url_english || command.audio_url,
      'igbo': command.audio_url_igbo || command.audio_url_english || command.audio_url,
      'pidgin': command.audio_url_pidgin || command.audio_url_english || command.audio_url
    };
    
    return languageMap[language] || command.audio_url_english || command.audio_url;
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
