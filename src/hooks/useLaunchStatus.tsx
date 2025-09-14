import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LaunchStatus {
  success: boolean;
  launch_date?: string;
  server_time?: string;
  is_launched?: boolean;
  error?: string;
}

export const useLaunchStatus = () => {
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaunchStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('public_get_launch_status' as any);
      
      if (error) {
        console.error('Error fetching launch status:', error);
        setError(error.message);
        return;
      }

      setLaunchStatus(data as LaunchStatus);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch launch status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaunchStatus();

    // Set up real-time subscription for launch control changes
    const channel = supabase
      .channel('launch-control-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_launch_control'
        },
        () => {
          // Refetch when admin changes launch settings
          fetchLaunchStatus();
        }
      )
      .subscribe();

    // Also refresh every 30 seconds as fallback
    const interval = setInterval(fetchLaunchStatus, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return {
    launchStatus,
    loading,
    error,
    refetch: fetchLaunchStatus
  };
};