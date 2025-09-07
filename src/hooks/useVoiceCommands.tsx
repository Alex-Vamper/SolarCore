import { useState, useEffect } from 'react';
import { GlobalVoiceCommand } from '@/entities/GlobalVoiceCommand';

export function useVoiceCommands() {
  const [commands, setCommands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommands();
  }, []);

  const loadCommands = async () => {
    try {
      // Fetch global commands from admin_ander_commands
      const globalCommands = await GlobalVoiceCommand.list();
      
      // Transform to match expected format
      const transformedCommands = globalCommands.map(cmd => ({
        id: cmd.id,
        command_category: cmd.command_category,
        command_name: cmd.command_name,
        keywords: cmd.keywords || [],
        response: cmd.response_text,
        audio_url: cmd.audio_url,
        action_type: cmd.action_type,
        enabled: cmd.is_active
      }));
      
      setCommands(transformedCommands);
    } catch (error) {
      console.error('Error loading voice commands:', error);
      setCommands([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { commands, isLoading, refetch: loadCommands };
}