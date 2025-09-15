// Unified Device State Management Service
import { Room, ChildDevice } from "@/entities/all";
import { supabase } from "@/integrations/supabase/client";
import { deviceStateLogger } from "./deviceStateLogger";

interface DeviceState {
  status?: boolean;
  intensity?: number;
  color_tint?: 'white' | 'warm' | 'cool';
  auto_mode?: boolean;
  power_usage?: number;
}

interface SyncResult {
  success: boolean;
  appliancesUpdated: number;
  childDevicesUpdated: number;
  errors: string[];
}

class DeviceStateService {
  // Update device state in both rooms.appliances and child_devices tables
  async updateDeviceState(
    roomId: string, 
    applianceId: string, 
    updates: DeviceState
  ): Promise<{ success: boolean; error?: string }> {
    deviceStateLogger.log('DEVICE_STATE_SERVICE', `Updating device state`, {
      roomId,
      applianceId,
      updates
    });

    try {
      // 1. Get current room data
      const room = await Room.get(roomId);
      if (!room) {
        deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Room not found', { roomId });
        return { success: false, error: 'Room not found' };
      }

      // 2. Find the appliance
      const appliance = room.appliances?.find(app => app.id === applianceId);
      if (!appliance) {
        deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Appliance not found', { applianceId });
        return { success: false, error: 'Appliance not found' };
      }

      const oldState = { ...appliance };
      const newAppliance = { ...appliance, ...updates };

      deviceStateLogger.logStateChange('DEVICE_STATE_SERVICE', 'appliance_update', applianceId, oldState, newAppliance);

      // 3. Update rooms.appliances
      const updatedAppliances = room.appliances.map(app => 
        app.id === applianceId ? newAppliance : app
      );

      await Room.update(roomId, { appliances: updatedAppliances });
      deviceStateLogger.log('DEVICE_STATE_SERVICE', 'Room appliances updated successfully');

      // 4. Update child_devices table if child_device_id exists
      if (appliance.child_device_id) {
        const childState = {
          status: newAppliance.status,
          intensity: newAppliance.intensity,
          color_tint: newAppliance.color_tint, 
          auto_mode: newAppliance.auto_mode,
          power_usage: newAppliance.power_usage,
          last_updated: new Date().toISOString()
        };

        const { error: childError } = await supabase
          .from('child_devices')
          .update({ state: childState })
          .eq('id', appliance.child_device_id);

        if (childError) {
          deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Failed to update child device', childError);
          // Continue anyway - at least room.appliances is updated
        } else {
          deviceStateLogger.log('DEVICE_STATE_SERVICE', 'Child device updated successfully', {
            child_device_id: appliance.child_device_id,
            state: childState
          });
        }
      }

      // 5. Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('deviceStateChanged', {
        detail: { roomId, applianceId, updates, success: true }
      }));

      return { success: true };

    } catch (error) {
      deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Failed to update device state', error);
      return { success: false, error: error.message };
    }
  }

  // Sync room appliances with child devices states
  async syncRoomWithBackend(roomId: string): Promise<SyncResult> {
    deviceStateLogger.log('DEVICE_STATE_SERVICE', `Syncing room with backend`, { roomId });

    const result: SyncResult = {
      success: true,
      appliancesUpdated: 0,
      childDevicesUpdated: 0,
      errors: []
    };

    try {
      const room = await Room.get(roomId);
      if (!room) {
        result.success = false;
        result.errors.push('Room not found');
        return result;
      }

      const appliancesWithChildIds = room.appliances?.filter(app => app.child_device_id) || [];
      
      if (appliancesWithChildIds.length === 0) {
        deviceStateLogger.log('DEVICE_STATE_SERVICE', 'No appliances with child_device_id to sync');
        return result;
      }

      const childIds = appliancesWithChildIds.map(app => app.child_device_id);
      
      const { data: childDevices, error } = await supabase
        .from('child_devices')
        .select('id, state')
        .in('id', childIds);

      if (error) {
        result.success = false;
        result.errors.push(`Failed to fetch child devices: ${error.message}`);
        return result;
      }

      // Update appliances with backend states
      let updatedAppliances = [...room.appliances];
      let hasChanges = false;

      for (const appliance of appliancesWithChildIds) {
        const childDevice = childDevices?.find(cd => cd.id === appliance.child_device_id);
        if (childDevice && childDevice.state) {
          const state = childDevice.state as any;
          const applianceIndex = updatedAppliances.findIndex(app => app.id === appliance.id);
          
          if (applianceIndex !== -1) {
            const oldAppliance = updatedAppliances[applianceIndex];
            const newAppliance = {
              ...oldAppliance,
              status: state.status ?? oldAppliance.status,
              intensity: state.intensity ?? oldAppliance.intensity,
              color_tint: state.color_tint ?? oldAppliance.color_tint,
              auto_mode: state.auto_mode ?? oldAppliance.auto_mode,
              power_usage: state.power_usage ?? oldAppliance.power_usage
            };

            // Check if there are actual changes
            const hasStateChanges = JSON.stringify(oldAppliance) !== JSON.stringify(newAppliance);
            
            if (hasStateChanges) {
              updatedAppliances[applianceIndex] = newAppliance;
              hasChanges = true;
              result.appliancesUpdated++;
              
              deviceStateLogger.logStateChange(
                'DEVICE_STATE_SERVICE', 
                'sync_from_backend', 
                appliance.id, 
                oldAppliance, 
                newAppliance
              );
            }
          }
        }
      }

      // Update room if there are changes
      if (hasChanges) {
        await Room.update(roomId, { appliances: updatedAppliances });
        deviceStateLogger.log('DEVICE_STATE_SERVICE', `Sync completed - ${result.appliancesUpdated} appliances updated`);
      } else {
        deviceStateLogger.log('DEVICE_STATE_SERVICE', 'Sync completed - no changes needed');
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);
      deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Sync failed', error);
    }

    return result;
  }

  // Update multiple devices at once (used by voice commands)
  async updateMultipleDevices(
    roomUpdates: Array<{ roomId: string; applianceUpdates: Array<{ id: string; updates: DeviceState }> }>
  ): Promise<{ success: boolean; errors: string[] }> {
    deviceStateLogger.log('DEVICE_STATE_SERVICE', 'Updating multiple devices', { roomUpdates });

    const errors: string[] = [];
    
    try {
      for (const roomUpdate of roomUpdates) {
        const room = await Room.get(roomUpdate.roomId);
        if (!room) {
          errors.push(`Room ${roomUpdate.roomId} not found`);
          continue;
        }

        // Create a copy of appliances to work with
        let updatedAppliances = [...room.appliances];
        const childDeviceUpdates: Array<{ id: string; state: any }> = [];

        // Apply updates ONLY to specified appliances - this is critical
        for (const applianceUpdate of roomUpdate.applianceUpdates) {
          const applianceIndex = updatedAppliances.findIndex(app => app.id === applianceUpdate.id);
          if (applianceIndex !== -1) {
            const oldAppliance = updatedAppliances[applianceIndex];
            
            // Only update the specified fields, preserve all other properties
            const newAppliance = { 
              ...oldAppliance, 
              ...applianceUpdate.updates 
            };
            
            updatedAppliances[applianceIndex] = newAppliance;

            deviceStateLogger.logStateChange(
              'DEVICE_STATE_SERVICE',
              'bulk_update',
              applianceUpdate.id,
              oldAppliance,
              newAppliance
            );

            // Prepare child device update if needed
            if (oldAppliance.child_device_id) {
              childDeviceUpdates.push({
                id: oldAppliance.child_device_id,
                state: {
                  status: newAppliance.status,
                  intensity: newAppliance.intensity,
                  color_tint: newAppliance.color_tint,
                  auto_mode: newAppliance.auto_mode,
                  power_usage: newAppliance.power_usage,
                  last_updated: new Date().toISOString()
                }
              });
            }
          } else {
            deviceStateLogger.logError('DEVICE_STATE_SERVICE', `Appliance ${applianceUpdate.id} not found in room`);
            errors.push(`Appliance ${applianceUpdate.id} not found`);
          }
        }

        // Update room appliances with the modified array
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ appliances: updatedAppliances as any })
          .eq('id', roomUpdate.roomId);
          
        if (roomError) {
          errors.push(`Failed to update room: ${roomError.message}`);
          deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Failed to update room', roomError);
        }

        // Update child devices in batch
        for (const childUpdate of childDeviceUpdates) {
          const { error } = await supabase
            .from('child_devices')
            .update({ state: childUpdate.state })
            .eq('id', childUpdate.id);

          if (error) {
            errors.push(`Failed to update child device ${childUpdate.id}: ${error.message}`);
            deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Failed to update child device', error);
          }
        }
      }

      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('deviceStateChanged', {
        detail: { type: 'bulk_update', success: errors.length === 0 }
      }));

      deviceStateLogger.log('DEVICE_STATE_SERVICE', 'Bulk update completed', {
        totalRooms: roomUpdates.length,
        errors: errors.length
      });

      return { success: errors.length === 0, errors };

    } catch (error) {
      deviceStateLogger.logError('DEVICE_STATE_SERVICE', 'Bulk update failed', error);
      return { success: false, errors: [...errors, error.message] };
    }
  }
}

export const deviceStateService = new DeviceStateService();