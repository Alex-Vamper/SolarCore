import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { deviceStateService } from '@/lib/deviceStateService';
import { deviceStateLogger } from '@/lib/deviceStateLogger';
import { cameraSyncManager } from '@/lib/cameraSyncManager';
import { Room } from '@/entities/Room';

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
    deviceStateLogger.log('CAMERA_SYNC', 'Starting controlled camera sync', { roomId });

    try {
      const room = await Room.get(roomId);
      if (!room || !mountedRef.current) {
        deviceStateLogger.logError('CAMERA_SYNC', 'Room not found or component unmounted', { roomId });
        return;
      }

      const cameraAppliances = room.appliances?.filter(app => app.type === 'smart_camera') || [];
      
      if (cameraAppliances.length === 0) {
        deviceStateLogger.log('CAMERA_SYNC', 'No camera appliances found');
        return;
      }

      const appliancesWithChildIds = cameraAppliances.filter(app => app.child_device_id);
      
      if (appliancesWithChildIds.length === 0) {
        deviceStateLogger.log('CAMERA_SYNC', 'No camera appliances with child device IDs');
        return;
      }

      const childIds = appliancesWithChildIds.map(app => app.child_device_id);
      
      const { data: childDevices, error } = await supabase
        .from('child_devices')
        .select('id, state')
        .in('id', childIds);

      if (error || !mountedRef.current) {
        deviceStateLogger.logError('CAMERA_SYNC', 'Failed to fetch child devices', error);
        return;
      }

      // Simple read-only sync - only update UI state, don't update database
      for (const appliance of appliancesWithChildIds) {
        const childDevice = childDevices?.find(cd => cd.id === appliance.child_device_id);
        
        if (childDevice && childDevice.state && mountedRef.current) {
          const state = childDevice.state as CameraState;
          
          // Only dispatch UI events, don't update database
          if (state.camera_ip && state.camera_ip !== appliance.camera_ip) {
            window.dispatchEvent(new CustomEvent('cameraIpUpdated', {
              detail: {
                roomId,
                applianceId: appliance.id,
                cameraIp: state.camera_ip,
                status: state.status,
                source: 'sync'
              }
            }));
          }
        }
      }

      deviceStateLogger.log('CAMERA_SYNC', 'Camera sync completed (read-only)', { roomId });

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
    deviceStateLogger.log('CAMERA_SYNC', 'Syncing camera state to backend', {
      roomId,
      applianceId,
      cameraState
    });

    try {
      const result = await deviceStateService.updateDeviceState(roomId, applianceId, cameraState);
      
      if (result.success) {
        deviceStateLogger.log('CAMERA_SYNC', 'Camera state synced to backend successfully');
        
        // Dispatch success event
        window.dispatchEvent(new CustomEvent('cameraStateChanged', {
          detail: {
            roomId,
            applianceId,
            ...cameraState,
            source: 'frontend',
            success: true
          }
        }));
      } else {
        deviceStateLogger.logError('CAMERA_SYNC', 'Failed to sync camera state to backend', result.error);
      }

      return result;
    } catch (error) {
      deviceStateLogger.logError('CAMERA_SYNC', 'Camera backend sync error', error);
      return { success: false, error: error.message };
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