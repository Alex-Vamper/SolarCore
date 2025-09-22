import { useState, useEffect } from 'react';
import { GlobalVoiceCommand } from '@/entities/GlobalVoiceCommand';

export function useVoiceCommands(userSettings?: any) {
  const [commands, setCommands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommands();
  }, [userSettings]);

  const loadCommands = async () => {
    try {
      // Fetch global commands from admin_ander_commands table with subscription filtering
      const globalCommands = await GlobalVoiceCommand.list(userSettings);
      
      // Use the global commands directly - they are already in the correct format
      setCommands(globalCommands);
    } catch (error) {
      console.error('Error loading voice commands:', error);
      setCommands([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { commands, isLoading, refetch: loadCommands };
}