import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { ChildDeviceService, type ChildDevice, type DeviceType } from './ChildDevice';
import { useToast } from '@/hooks/use-toast';

export interface SafetySystem {
  id?: string;
  user_id?: string;
  system_id: string;
  system_type: 'fire_detection' | 'rain_detection' | 'gas_leak' | 'water_overflow';
  room_name: string;
  status?: string;
  flame_status?: string;  // For fire detection: 'clear' or 'flames'
  temperature_value?: number;  // Numerical temperature readings
  smoke_percentage?: number;  // 0-100 percentage for smoke level
  last_triggered?: string;
  sensor_readings?: any;
  automation_settings?: any;
  created_at?: string;
  updated_at?: string;
  parent_id?: string; // Add parent_id for direct creation
}

// Convert ChildDevice to SafetySystem format for backwards compatibility
const mapChildDeviceToSafetySystem = (device: ChildDevice): SafetySystem => {
  return {
    id: device.id,
    user_id: device.created_by,
    system_id: device.device_name || '',
    system_type: device.device_type?.device_series as 'fire_detection' | 'rain_detection' | 'gas_leak' | 'water_overflow',
    room_name: device.state?.room_name || '',
    status: device.state?.status || 'safe',
    flame_status: device.state?.flame_status || 'clear',
    temperature_value: device.state?.temperature || 25,
    smoke_percentage: device.state?.smoke_percentage || 0,
    last_triggered: device.state?.last_triggered,
    sensor_readings: device.state?.sensor_readings || {},
    automation_settings: device.state?.automation_settings || {},
    created_at: device.created_at,
    updated_at: device.updated_at
  };
};

// Convert SafetySystem to ChildDevice format
const mapSafetySystemToChildDevice = (safetySystem: SafetySystem, deviceTypeId?: string): Partial<ChildDevice> => {
  return {
    id: safetySystem.id,
    device_type_id: deviceTypeId,
    device_name: safetySystem.system_id,
    state: {
      room_name: safetySystem.room_name,
      status: safetySystem.status || 'safe',
      flame_status: safetySystem.flame_status || 'clear',
      temperature: safetySystem.temperature_value || 25,
      smoke_percentage: safetySystem.smoke_percentage || 0,
      last_triggered: safetySystem.last_triggered,
      sensor_readings: safetySystem.sensor_readings || {},
      automation_settings: safetySystem.automation_settings || {}
    }
  };
};

export class SafetySystemService {
  // Retry mechanism for failed operations
  private static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }

  static async filter(params?: any): Promise<SafetySystem[]> {
    return this.withRetry(() => this.list());
  }

  static async get(id: string): Promise<SafetySystem | null> {
    return this.withRetry(async () => {
      const device = await ChildDeviceService.get(id);
      if (!device || device.device_type?.device_class !== 'safety') {
        return null;
      }
      return mapChildDeviceToSafetySystem(device);
    });
  }

  static async list(): Promise<SafetySystem[]> {
    return this.withRetry(async () => {
      console.log('[SafetySystemService] Starting to list safety systems...');
      const devices = await ChildDeviceService.getSafetyDevices();
      console.log('[SafetySystemService] Raw safety devices from ChildDeviceService:', devices);
      
      const mappedSystems = devices.map(mapChildDeviceToSafetySystem);
      console.log('[SafetySystemService] Mapped safety systems:', mappedSystems);
      
      return mappedSystems;
    });
  }

  static async create(safetySystem: SafetySystem): Promise<SafetySystem> {
    return this.withRetry(async () => {
      // Get device type ID for the safety system type
      const { data: deviceTypes } = await supabase.rpc('get_device_types');
      const deviceType = (deviceTypes as DeviceType[])?.find(dt => 
        dt.device_class === 'safety' && dt.device_series === safetySystem.system_type
      );
      
      if (!deviceType) {
        throw new Error(`Device type not found for ${safetySystem.system_type}. Available types: ${(deviceTypes as DeviceType[])?.filter(dt => dt.device_class === 'safety').map(dt => dt.device_series).join(', ')}`);
      }

      // Get parent_id from the passed parameter or claim result
      let parentId = safetySystem.parent_id;
      
      if (!parentId) {
        throw new Error('Parent device ID is required. Make sure the device is claimed first.');
      }

      // Use the create_child_device RPC function for proper validation and creation
      const { data: createResult, error: createError } = await supabase.rpc('create_child_device', {
        p_parent_id: parentId,
        p_device_type_id: deviceType.id,
        p_device_name: safetySystem.system_id,
        p_initial_state: {
          room_name: safetySystem.room_name,
          status: safetySystem.status || 'safe',
          flame_status: safetySystem.flame_status || 'clear',
          temperature: safetySystem.temperature_value || 25,
          smoke_percentage: safetySystem.smoke_percentage || 0,
          last_triggered: safetySystem.last_triggered,
          sensor_readings: safetySystem.sensor_readings || {},
          automation_settings: safetySystem.automation_settings || {}
        }
      });

      if (createError || !(createResult as any)?.success) {
        console.error('Create child device error:', createError, createResult);
        const errorMessage = (createResult as any)?.message || createError?.message || 'Failed to create safety system';
        throw new Error(errorMessage);
      }

      // Return the safety system data directly to avoid permission issues
      return {
        id: (createResult as any).child_id,
        user_id: undefined, // Will be set by database
        system_id: safetySystem.system_id,
        system_type: safetySystem.system_type,
        room_name: safetySystem.room_name,
        status: safetySystem.status || 'safe',
        flame_status: safetySystem.flame_status || 'clear',
        temperature_value: safetySystem.temperature_value || 25,
        smoke_percentage: safetySystem.smoke_percentage || 0,
        last_triggered: safetySystem.last_triggered,
        sensor_readings: safetySystem.sensor_readings || {},
        automation_settings: safetySystem.automation_settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  }

  static async update(id: string, safetySystem: Partial<SafetySystem>): Promise<SafetySystem> {
    return this.withRetry(async () => {
      // Get the existing device to preserve device_type_id
      const existingDevice = await ChildDeviceService.get(id);
      if (!existingDevice) throw new Error('Safety system not found');

      const updatedChildDevice = mapSafetySystemToChildDevice(safetySystem as SafetySystem);
      const updatedDevice = await ChildDeviceService.update(id, updatedChildDevice);
      
      return mapChildDeviceToSafetySystem(updatedDevice);
    });
  }

  static async delete(id: string): Promise<void> {
    return this.withRetry(async () => {
      await ChildDeviceService.delete(id);
    });
  }

  static async upsert(safetySystem: SafetySystem): Promise<SafetySystem> {
    if (safetySystem.id) {
      return this.update(safetySystem.id, safetySystem);
    } else {
      return this.create(safetySystem);
    }
  }
}

// Backwards compatibility
export const SafetySystem = SafetySystemService;