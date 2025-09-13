import { ChildDeviceService, type ChildDevice, type DeviceType } from './ChildDevice';
import { supabase } from '@/integrations/supabase/client';

export interface SecuritySystem {
  id?: string;
  user_id?: string;
  system_id: string;
  system_type: 'door_control';
  lock_status?: 'locked' | 'unlocked';
  security_mode?: 'home' | 'away';
  last_action?: string;
  created_at?: string;
  updated_at?: string;
}

// Convert ChildDevice to SecuritySystem format
const mapChildDeviceToSecuritySystem = (device: ChildDevice): SecuritySystem => {
  return {
    id: device.id,
    user_id: device.created_by,
    system_id: device.device_name || '',
    system_type: 'door_control',
    lock_status: device.state?.lock_status || 'unlocked',
    security_mode: device.state?.security_mode || 'home',
    last_action: device.state?.last_action,
    created_at: device.created_at,
    updated_at: device.updated_at
  };
};

// Convert SecuritySystem to ChildDevice format
const mapSecuritySystemToChildDevice = (securitySystem: SecuritySystem, deviceTypeId?: string): Partial<ChildDevice> => {
  return {
    id: securitySystem.id,
    device_type_id: deviceTypeId,
    device_name: securitySystem.system_id,
    state: {
      lock_status: securitySystem.lock_status || 'unlocked',
      security_mode: securitySystem.security_mode || 'home',
      last_action: securitySystem.last_action || new Date().toISOString()
    }
  };
};

export class SecuritySystemService {
  static async filter(params?: any): Promise<SecuritySystem[]> {
    return this.list();
  }

  static async get(id: string): Promise<SecuritySystem | null> {
    try {
      const device = await ChildDeviceService.get(id);
      if (!device || device.device_type?.device_class !== 'security') {
        return null;
      }
      return mapChildDeviceToSecuritySystem(device);
    } catch (error) {
      console.error('Error fetching security system:', error);
      return null;
    }
  }

  static async list(): Promise<SecuritySystem[]> {
    try {
      const devices = await ChildDeviceService.getSecurityDevices();
      return devices.map(mapChildDeviceToSecuritySystem);
    } catch (error) {
      console.error('Error fetching security systems:', error);
      return [];
    }
  }

  static async create(securitySystem: SecuritySystem): Promise<SecuritySystem> {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Find parent device based on system_id (ESP ID)
      const { data: parentDevices, error: parentError } = await supabase
        .from('parent_devices')
        .select('*')
        .eq('esp_id', securitySystem.system_id)
        .eq('owner_account', user.id);

      if (parentError) {
        console.error('Error finding parent device:', parentError);
        throw new Error('Failed to find parent device');
      }

      if (!parentDevices || parentDevices.length === 0) {
        throw new Error(`No parent device found for ESP ID: ${securitySystem.system_id}. Please claim the device first.`);
      }

      const parentDevice = parentDevices[0];

      // Get device type for security/door_control
      const { data: deviceTypes, error: typeError } = await supabase.rpc('get_device_types');
      if (typeError) {
        console.error('Error fetching device types:', typeError);
        throw new Error('Failed to get device types');
      }

      const deviceType = (deviceTypes as DeviceType[])?.find(dt => 
        dt.device_class === 'security' && dt.device_series === 'door_control'
      );
      
      if (!deviceType) {
        throw new Error('Security device type not found');
      }

      // Use create_child_device RPC for proper creation with authentication
      const { data: createResult, error: createError } = await supabase.rpc('create_child_device', {
        p_parent_id: parentDevice.id,
        p_device_type_id: deviceType.id,
        p_device_name: securitySystem.system_id,
        p_initial_state: {
          lock_status: securitySystem.lock_status || 'unlocked',
          security_mode: securitySystem.security_mode || 'home',
          last_action: securitySystem.last_action || new Date().toISOString()
        }
      });

      if (createError || !(createResult as any)?.success) {
        console.error('Error creating child device:', createError, createResult);
        throw new Error((createResult as any)?.message || 'Failed to create security device');
      }

      // Get the created device
      const createdDevice = await ChildDeviceService.get((createResult as any).child_id);
      if (!createdDevice) {
        throw new Error('Failed to retrieve created security device');
      }
      
      return mapChildDeviceToSecuritySystem(createdDevice);
    } catch (error) {
      console.error('Error creating security system:', error);
      throw error;
    }
  }

  static async update(id: string, securitySystem: Partial<SecuritySystem>): Promise<SecuritySystem> {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Use update_child_state RPC for proper update with authentication
      const { data: updateResult, error: updateError } = await supabase.rpc('update_child_state', {
        p_child_id: id,
        p_new_state: {
          lock_status: securitySystem.lock_status,
          security_mode: securitySystem.security_mode,
          last_action: securitySystem.last_action || new Date().toISOString()
        }
      });

      if (updateError || !(updateResult as any)?.success) {
        console.error('Error updating child device state:', updateError, updateResult);
        throw new Error((updateResult as any)?.message || 'Failed to update security device');
      }

      // Get the updated device
      const updatedDevice = await ChildDeviceService.get(id);
      if (!updatedDevice) {
        throw new Error('Failed to retrieve updated security device');
      }
      
      return mapChildDeviceToSecuritySystem(updatedDevice);
    } catch (error) {
      console.error('Error updating security system:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await ChildDeviceService.delete(id);
    } catch (error) {
      console.error('Error deleting security system:', error);
      throw error;
    }
  }

  static async upsert(securitySystem: SecuritySystem): Promise<SecuritySystem> {
    if (securitySystem.id) {
      return this.update(securitySystem.id, securitySystem);
    } else {
      return this.create(securitySystem);
    }
  }
}

// Backwards compatibility
export const SecuritySystem = SecuritySystemService;