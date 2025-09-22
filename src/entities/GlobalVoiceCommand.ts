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
    if (!userSettings) return commands;

    const subscriptionPlan = userSettings.subscription_plan || 'free';
    
    // If free plan, filter out specific device commands (only allow global commands)
    if (subscriptionPlan === 'free') {
      return commands.filter(cmd => {
        // Allow all system_control commands
        if (cmd.command_category === 'system_control') return true;
        
        // For other categories, only allow commands that don't target specific devices
        const cmdName = cmd.command_name.toLowerCase();
        const keywords = cmd.keywords?.join(' ').toLowerCase() || '';
        
        // Allow "all" commands - global room commands
        if (cmdName.includes('all') || keywords.includes('all')) return true;
        
        // Allow room-level commands (not specific device commands)
        const isRoomLevel = [
          'living room lights', 'bedroom lights', 'kitchen lights', 'dining room lights',
          'living room sockets', 'bedroom sockets', 'kitchen sockets', 'dining room sockets',
          'living room ac', 'bedroom ac', 'kitchen ac', 'dining room ac',
          'living room windows', 'bedroom windows', 'kitchen windows', 'dining room windows',
          'living room curtains', 'bedroom curtains', 'kitchen curtains', 'dining room curtains'
        ].some(roomCmd => cmdName.includes(roomCmd) || keywords.includes(roomCmd));
        
        if (isRoomLevel) return true;
        
        // Block specific device commands (e.g., "ceiling lights", "wall lights", "TV socket")
        const isSpecificDevice = [
          'ceiling', 'wall', 'tv socket', 'dispenser socket', 'free socket'
        ].some(specific => cmdName.includes(specific) || keywords.includes(specific));
        
        return !isSpecificDevice;
      });
    }
    
    // Premium users get all commands
    return commands;
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
