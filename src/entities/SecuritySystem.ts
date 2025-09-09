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
      // Get device type ID for door control
      const { data: deviceTypes } = await supabase.rpc('get_device_types');
      const deviceType = (deviceTypes as DeviceType[])?.find(dt => 
        dt.device_class === 'security' && dt.device_series === 'door_control'
      );
      
      if (!deviceType) throw new Error('Device type not found');

      const childDevice = mapSecuritySystemToChildDevice(securitySystem, deviceType.id);
      const createdDevice = await ChildDeviceService.create(childDevice as ChildDevice);
      
      return mapChildDeviceToSecuritySystem(createdDevice);
    } catch (error) {
      console.error('Error creating security system:', error);
      throw error;
    }
  }

  static async update(id: string, securitySystem: Partial<SecuritySystem>): Promise<SecuritySystem> {
    try {
      const updatedChildDevice = mapSecuritySystemToChildDevice(securitySystem as SecuritySystem);
      const updatedDevice = await ChildDeviceService.update(id, updatedChildDevice);
      
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