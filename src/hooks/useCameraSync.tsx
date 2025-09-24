import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { deviceStateLogger } from '@/lib/deviceStateLogger';
import { cameraSyncManager } from '@/lib/cameraSyncManager';
import { UnifiedDeviceStateService } from '@/services/UnifiedDeviceStateService';
import { CameraConfiguration } from '@/entities/CameraConfiguration';

interface CameraState {
  camera_ip?: string;
  status?: boolean;
  last_updated?: string;
}

interface RealtimePayload {
  eventType: string;
  new?: {
    id: string;
    state: any;
    [key: string]: any;
  };
  old?: {
    id: string;
    state: any;
    [key: string]: any;
  };
}

export function useCameraSync(roomId: string) {
  const [issyncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!roomId) return;
    
    mountedRef.current = true;

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Set up a minimal real-time subscription that doesn't trigger syncs
    // Only listen for camera-specific changes and avoid triggering loops
    channelRef.current = supabase
      .channel(`camera-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'child_devices',
          filter: `state->>camera_ip.neq.null`
        },
        async (payload: any) => {
          if (!mountedRef.current) return;
          
          // Only process camera IP changes from external sources
          const oldCameraIp = payload.old?.state?.camera_ip;
          const newCameraIp = payload.new?.state?.camera_ip;
          
          if (oldCameraIp !== newCameraIp) {
            deviceStateLogger.log('CAMERA_SYNC', 'Camera IP changed externally', {
              deviceId: payload.new?.id,
              oldIp: oldCameraIp,
              newIp: newCameraIp
            });

            // Dispatch event for UI updates without triggering sync
            if (newCameraIp) {
              window.dispatchEvent(new CustomEvent('cameraIpUpdated', {
                detail: {
                  roomId,
                  deviceId: payload.new?.id,
                  cameraIp: newCameraIp,
                  source: 'external'
                }
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      cameraSyncManager.endSync(roomId);
    };
  }, [roomId]);

  const syncCameraStatesFromBackend = async (roomId: string) => {
    if (!mountedRef.current) return;
    
    // Use sync manager to prevent infinite loops
    if (!cameraSyncManager.startSync(roomId)) {
      deviceStateLogger.log('CAMERA_SYNC', 'Sync prevented by manager', { roomId });
      return;
    }
    
    setSyncing(true);
    setLastSyncTime(Date.now());
    deviceStateLogger.log('CAMERA_SYNC', 'Starting unified camera sync', { roomId });

    try {
      // Get camera configurations from the new dedicated table
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: cameraConfigs, error } = await supabase
        .from('camera_configurations')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('room_id', roomId);

      if (error) {
        deviceStateLogger.logError('CAMERA_SYNC', 'Failed to fetch camera configurations', error);
        return;
      }

      // Dispatch events for UI updates without triggering database writes
      for (const config of cameraConfigs || []) {
        if (mountedRef.current) {
          window.dispatchEvent(new CustomEvent('cameraConfigUpdated', {
            detail: {
              roomId,
              applianceId: config.appliance_id,
              config,
              source: 'sync'
            }
          }));
        }
      }

      deviceStateLogger.log('CAMERA_SYNC', 'Unified camera sync completed', { roomId, count: cameraConfigs?.length || 0 });

    } catch (error) {
      deviceStateLogger.logError('CAMERA_SYNC', 'Camera sync failed', error);
    } finally {
      if (mountedRef.current) {
        setSyncing(false);
      }
      cameraSyncManager.endSync(roomId);
    }
  };

  const syncCameraStateToBackend = async (
    roomId: string, 
    applianceId: string, 
    cameraState: Partial<CameraState>
  ) => {
    deviceStateLogger.log('CAMERA_SYNC', 'Syncing camera state using unified service', {
      roomId,
      applianceId,
      cameraState
    });

    try {
      const result = await UnifiedDeviceStateService.updateDeviceState({
        deviceType: 'camera',
        deviceId: applianceId,
        state: cameraState,
        metadata: { roomId }
      });
      
      if (result.success) {
        deviceStateLogger.log('CAMERA_SYNC', 'Camera state synced successfully via unified service');
        
        // Dispatch success event
        window.dispatchEvent(new CustomEvent('cameraStateChanged', {
          detail: {
            roomId,
            applianceId,
            ...cameraState,
            source: 'unified_service',
            success: true
          }
        }));
      } else {
        deviceStateLogger.logError('CAMERA_SYNC', 'Failed to sync camera state', result.error);
      }

      return result;
    } catch (error) {
      deviceStateLogger.logError('CAMERA_SYNC', 'Camera sync error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const triggerManualSync = async () => {
    if (!cameraSyncManager.canSync(roomId)) {
      deviceStateLogger.log('CAMERA_SYNC', 'Manual sync blocked by manager');
      return;
    }
    await syncCameraStatesFromBackend(roomId);
  };

  return {
    syncCameraStatesFromBackend: triggerManualSync,
    syncCameraStateToBackend,
    issyncing: issyncing || cameraSyncManager.isActive(roomId)
  };
}