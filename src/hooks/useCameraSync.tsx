import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { deviceStateService } from '@/lib/deviceStateService';
import { deviceStateLogger } from '@/lib/deviceStateLogger';
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

  useEffect(() => {
    if (!roomId) return;

    // Set up real-time subscription for child device state changes
    const channel = supabase
      .channel('camera-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'child_devices'
        },
        async (payload: any) => {
          // Only process if this change involves camera IP
          const hasCamera = payload.new?.state?.camera_ip || payload.old?.state?.camera_ip;
          if (!hasCamera) return;

          // Prevent infinite loops - only sync if enough time has passed
          const now = Date.now();
          if (now - lastSyncTime < 2000) {
            deviceStateLogger.log('CAMERA_SYNC', 'Skipping sync - too soon since last sync');
            return;
          }

          deviceStateLogger.log('CAMERA_SYNC', 'Child device state changed', {
            event: payload.eventType,
            deviceId: payload.new?.id || payload.old?.id,
            newState: payload.new?.state,
            oldState: payload.old?.state
          });

          // Debounced sync to prevent infinite loops
          setTimeout(() => {
            syncCameraStatesFromBackend(roomId);
          }, 500);
        }
      )
      .subscribe();

    // Initial sync when component mounts
    syncCameraStatesFromBackend(roomId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const syncCameraStatesFromBackend = async (roomId: string) => {
    if (issyncing) return;
    
    setSyncing(true);
    setLastSyncTime(Date.now());
    deviceStateLogger.log('CAMERA_SYNC', 'Starting camera state sync from backend', { roomId });

    try {
      const room = await Room.get(roomId);
      if (!room) {
        deviceStateLogger.logError('CAMERA_SYNC', 'Room not found', { roomId });
        return;
      }

      const cameraAppliances = room.appliances?.filter(app => app.type === 'smart_camera') || [];
      
      if (cameraAppliances.length === 0) {
        deviceStateLogger.log('CAMERA_SYNC', 'No camera appliances found in room');
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

      if (error) {
        deviceStateLogger.logError('CAMERA_SYNC', 'Failed to fetch child devices', error);
        return;
      }

      let updatedAppliances = [...room.appliances];
      let hasChanges = false;

      for (const appliance of appliancesWithChildIds) {
        const childDevice = childDevices?.find(cd => cd.id === appliance.child_device_id);
        
        if (childDevice && childDevice.state) {
          const state = childDevice.state as CameraState;
          const applianceIndex = updatedAppliances.findIndex(app => app.id === appliance.id);
          
          if (applianceIndex !== -1) {
            const oldAppliance = updatedAppliances[applianceIndex];
            
            // Check if camera IP or status changed
            const cameraIpChanged = state.camera_ip !== oldAppliance.camera_ip;
            const statusChanged = state.status !== oldAppliance.status;
            
            if (cameraIpChanged || statusChanged) {
              const newAppliance = {
                ...oldAppliance,
                camera_ip: state.camera_ip || oldAppliance.camera_ip,
                status: state.status ?? oldAppliance.status
              };
              
              updatedAppliances[applianceIndex] = newAppliance;
              hasChanges = true;
              
              deviceStateLogger.logStateChange(
                'CAMERA_SYNC',
                'backend_sync',
                appliance.id,
                oldAppliance,
                newAppliance
              );

              // Dispatch camera-specific event
              window.dispatchEvent(new CustomEvent('cameraStateChanged', {
                detail: {
                  roomId,
                  applianceId: appliance.id,
                  cameraIp: state.camera_ip,
                  status: state.status,
                  source: 'backend'
                }
              }));
            }
          }
        }
      }

      if (hasChanges) {
        await Room.update(roomId, { appliances: updatedAppliances });
        deviceStateLogger.log('CAMERA_SYNC', 'Camera states synced from backend', {
          roomId,
          updatedCount: cameraAppliances.length
        });

        // Dispatch general room update event
        window.dispatchEvent(new CustomEvent('roomUpdated', {
          detail: { roomId, source: 'camera_sync' }
        }));
      } else {
        deviceStateLogger.log('CAMERA_SYNC', 'No camera state changes needed');
      }

    } catch (error) {
      deviceStateLogger.logError('CAMERA_SYNC', 'Camera sync failed', error);
    } finally {
      setSyncing(false);
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

  return {
    syncCameraStatesFromBackend: () => syncCameraStatesFromBackend(roomId),
    syncCameraStateToBackend,
    issyncing
  };
}