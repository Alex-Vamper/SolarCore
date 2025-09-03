import { useState, useEffect } from 'react';
import { VoiceCommand } from '@/entities/VoiceCommand';
import { supabase } from '@/integrations/supabase/client';

export function useVoiceCommands() {
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommands();
  }, []);

  const loadCommands = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user's own commands
      const userCommands = await VoiceCommand.list();
      
      // Get any global commands that have audio URLs
      const { data: globalCommands } = await supabase
        .from('voice_commands')
        .select('*')
        .eq('is_global', true)
        .not('audio_url', 'is', null);

      if (globalCommands && globalCommands.length > 0) {
        // Merge commands, preferring global audio
        const mergedCommands = userCommands.map(cmd => {
          const globalCmd = globalCommands.find(
            gc => gc.command_category === cmd.command_category && 
                 gc.command_name === cmd.command_name
          );
          
          if (globalCmd && globalCmd.audio_url) {
            return { ...cmd, audio_url: globalCmd.audio_url };
          }
          return cmd;
        });
        
        setCommands(mergedCommands);
      } else {
        setCommands(userCommands);
      }
    } catch (error) {
      console.error('Error loading voice commands:', error);
      setCommands([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { commands, isLoading, refetch: loadCommands };
}