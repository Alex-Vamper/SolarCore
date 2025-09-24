import { supabase } from '@/integrations/supabase/client';
import { DeviceStateSyncEntry, CameraConfiguration } from '@/entities/CameraConfiguration';
import { CameraDiscoveryService } from './CameraDiscoveryService';

export interface DeviceStateUpdate {
  deviceType: string;
  deviceId: string;
  state: Record<string, any>;
  metadata?: Record<string, any>;
}

export class UnifiedDeviceStateService {
  private static syncInProgress = new Set<string>();

  static async updateDeviceState(update: DeviceStateUpdate): Promise<{ success: boolean; error?: string }> {
    const syncKey = `${update.deviceType}:${update.deviceId}`;
    
    if (this.syncInProgress.has(syncKey)) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress.add(syncKey);

    try {
      // Update sync status
      await this.updateSyncStatus(update.deviceType, update.deviceId, 'syncing');

      // Handle different device types
      switch (update.deviceType) {
        case 'camera':
          await this.handleCameraStateUpdate(update);
          break;
        default:
          // Handle other device types here
          break;
      }

      await this.updateSyncStatus(update.deviceType, update.deviceId, 'success');
      return { success: true };
    } catch (error) {
      await this.updateSyncStatus(
        update.deviceType, 
        update.deviceId, 
        'error', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      this.syncInProgress.delete(syncKey);
    }
  }

  private static async handleCameraStateUpdate(update: DeviceStateUpdate): Promise<void> {
    const { deviceId, state } = update;

    if (state.camera_ip) {
      // Validate camera connection
      const validation = await CameraDiscoveryService.validateCameraIP(
        state.camera_ip,
        state.camera_port || 8080,
        state.camera_path || '/video'
      );

      // Update camera configuration
      const cameraUpdate: Partial<CameraConfiguration> = {
        camera_ip: state.camera_ip,
        camera_port: state.camera_port || 8080,
        camera_path: state.camera_path || '/video',
        status: validation.isValid ? 'connected' : 'error',
        connection_quality: validation.quality,
        camera_capabilities: validation.capabilities,
        last_error: validation.error || null,
        updated_at: new Date().toISOString()
      };

      if (validation.isValid) {
        cameraUpdate.last_connected_at = new Date().toISOString();
        cameraUpdate.retry_count = 0;
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('camera_configurations')
        .upsert({
          ...cameraUpdate,
          appliance_id: deviceId,
          user_id: user.data.user.id,
          camera_name: cameraUpdate.camera_name || `Camera ${deviceId}`,
          camera_ip: cameraUpdate.camera_ip!,
          room_id: update.metadata?.roomId || ''
        });

      if (error) {
        throw new Error(`Failed to update camera configuration: ${error.message}`);
      }
    }
  }

  private static async updateSyncStatus(
    deviceType: string,
    deviceId: string,
    status: DeviceStateSyncEntry['sync_status'],
    error?: string
  ): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const updates: Partial<DeviceStateSyncEntry> = {
        sync_status: status,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (status === 'error' && error) {
        updates.last_error = error;
        // Increment error count
        const { data: existing } = await supabase
          .from('device_state_sync')
          .select('error_count')
          .eq('user_id', user.data.user.id)
          .eq('device_type', deviceType)
          .eq('device_id', deviceId)
          .single();

        updates.error_count = (existing?.error_count || 0) + 1;
      } else if (status === 'success') {
        updates.error_count = 0;
        updates.last_error = null;
      }

      await supabase
        .from('device_state_sync')
        .upsert({
          ...updates,
          user_id: user.data.user.id,
          device_type: deviceType,
          device_id: deviceId
        });
    } catch (syncError) {
      console.error('Failed to update sync status:', syncError);
    }
  }

  static async getSyncStatus(deviceType: string, deviceId: string): Promise<DeviceStateSyncEntry | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

      const { data, error } = await supabase
        .from('device_state_sync')
        .select('*')
        .eq('user_id', user.data.user.id)
        .eq('device_type', deviceType)
        .eq('device_id', deviceId)
        .single();

      if (error || !data) return null;
      return data as DeviceStateSyncEntry;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }

  static async getCameraConfiguration(applianceId: string): Promise<CameraConfiguration | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

      const { data, error } = await supabase
        .from('camera_configurations')
        .select('*')
        .eq('user_id', user.data.user.id)
        .eq('appliance_id', applianceId)
        .single();

      if (error || !data) return null;
      return data as CameraConfiguration;
    } catch (error) {
      console.error('Failed to get camera configuration:', error);
      return null;
    }
  }

  static async retryConnection(applianceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cameraConfig = await this.getCameraConfiguration(applianceId);
      if (!cameraConfig) {
        return { success: false, error: 'Camera configuration not found' };
      }

      // Increment retry count
      await supabase
        .from('camera_configurations')
        .update({ 
          retry_count: cameraConfig.retry_count + 1,
          status: 'discovering',
          updated_at: new Date().toISOString()
        })
        .eq('id', cameraConfig.id);

      // Attempt connection with retry logic
      const result = await CameraDiscoveryService.connectWithRetry(cameraConfig);
      
      // Update status based on result
      await CameraDiscoveryService.updateCameraStatus(
        cameraConfig.id,
        result.isValid ? 'connected' : 'error',
        result.error
      );

      return { success: result.isValid, error: result.error };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Retry failed' 
      };
    }
  }
}