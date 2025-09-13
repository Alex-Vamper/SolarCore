import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SafetySystemService, type SafetySystem } from '@/entities/SafetySystem';
import { toast } from 'sonner';

export const useSafetySystemsRealtime = () => {
  const [safetySystems, setSafetySystems] = useState<SafetySystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSafetySystems = async () => {
    try {
      console.log('[useSafetySystemsRealtime] Loading safety systems...');
      setError(null);
      const systems = await SafetySystemService.list();
      console.log('[useSafetySystemsRealtime] Loaded safety systems:', systems);
      setSafetySystems(systems);
    } catch (err) {
      console.error('[useSafetySystemsRealtime] Error loading safety systems:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load safety systems';
      setError(errorMessage);
      toast.error('Failed to load safety systems', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: loadSafetySystems
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSafetySystems();

    // Set up real-time subscription
    const channel = supabase
      .channel('safety-systems-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'child_devices'
        },
        async (payload: any) => {
          console.log('[useSafetySystemsRealtime] Real-time child device update:', payload);
          
          // Always reload safety systems on any child_devices change to ensure we catch safety devices
          console.log('[useSafetySystemsRealtime] Reloading safety systems due to child_devices change');
          await loadSafetySystems();
          
          // Show notification for status changes
          if (payload.eventType === 'UPDATE' && payload.new?.state?.status !== payload.old?.state?.status) {
            const deviceName = payload.new?.device_name || 'Safety System';
            const newStatus = payload.new?.state?.status || 'unknown';
            const room = payload.new?.state?.room_name || 'Unknown Room';
            
            toast(
              `${deviceName} status changed to ${newStatus}`,
              {
                description: `Location: ${room} • ${new Date().toLocaleTimeString()}`,
                duration: 5000,
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refresh = () => {
    setIsLoading(true);
    loadSafetySystems();
  };

  return {
    safetySystems,
    isLoading,
    error,
    refresh
  };
};