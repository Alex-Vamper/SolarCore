import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface DeviceType {
  id: string;
  device_class: string;
  device_series: string;
  actions: any;
}

export interface ChildDevice {
  id?: string;
  parent_id?: string;
  device_type_id?: string;
  device_name?: string;
  state?: any;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  device_type?: DeviceType | null;
}

export class ChildDeviceService {
  static async filter(params?: any): Promise<ChildDevice[]> {
    return this.list(params);
  }

  static async get(id: string): Promise<ChildDevice | null> {
    try {
      const { data, error } = await supabase
        .from('child_devices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Get device type separately
      const { data: deviceTypes } = await supabase.rpc('get_device_types');
      const deviceType = (deviceTypes as DeviceType[])?.find(dt => dt.id === data.device_type_id);

      return {
        ...data,
        device_type: deviceType || null
      };

    } catch (error) {
      console.error('Error fetching child device:', error);
      return null;
    }
  }

  static async list(params?: { device_class?: string; device_series?: string }): Promise<ChildDevice[]> {
    try {
      const { data, error } = await supabase
        .from('child_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get device types and filter
      const { data: deviceTypes } = await supabase.rpc('get_device_types');
      
      const devicesWithTypes = data?.map(device => {
        const deviceType = (deviceTypes as DeviceType[])?.find(dt => dt.id === device.device_type_id);
        return {
          ...device,
          device_type: deviceType || null
        };
      }) || [];

      // Apply filters
      let filteredDevices = devicesWithTypes;
      if (params?.device_class) {
        filteredDevices = devicesWithTypes.filter(d => d.device_type?.device_class === params.device_class);
      }
      if (params?.device_series) {
        filteredDevices = filteredDevices.filter(d => d.device_type?.device_series === params.device_series);
      }

      return filteredDevices;

    } catch (error) {
      console.error('Error fetching child devices:', error);
      return [];
    }
  }

  static async create(childDevice: ChildDevice): Promise<ChildDevice> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const insertData = {
        parent_id: childDevice.parent_id,
        device_type_id: childDevice.device_type_id!,
        device_name: childDevice.device_name,
        state: childDevice.state as Json,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('child_devices')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;
      
      // Get device type separately
      const { data: deviceTypes } = await supabase.rpc('get_device_types');
      const deviceType = (deviceTypes as DeviceType[])?.find(dt => dt.id === data.device_type_id);

      return {
        ...data,
        device_type: deviceType || null
      };
    } catch (error) {
      console.error('Error creating child device:', error);
      throw error;
    }
  }

  static async update(id: string, childDevice: Partial<ChildDevice>): Promise<ChildDevice> {
    try {
      const updateData: any = { ...childDevice };
      if (childDevice.state) {
        updateData.state = childDevice.state as Json;
      }

      const { data, error } = await supabase
        .from('child_devices')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      
      // Get device type separately
      const { data: deviceTypes } = await supabase.rpc('get_device_types');
      const deviceType = (deviceTypes as DeviceType[])?.find(dt => dt.id === data.device_type_id);

      return {
        ...data,
        device_type: deviceType || null
      };
    } catch (error) {
      console.error('Error updating child device:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('delete_child_device', {
        p_child_id: id
      });

      if (error) throw error;
      
      const result = data as { success: boolean; message?: string };
      if (!result?.success) {
        throw new Error(result?.message || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting child device:', error);
      throw error;
    }
  }

  static async upsert(childDevice: ChildDevice): Promise<ChildDevice> {
    if (childDevice.id) {
      return this.update(childDevice.id, childDevice);
    } else {
      return this.create(childDevice);
    }
  }

  // Helper methods for different device types
  static async getSafetyDevices(): Promise<ChildDevice[]> {
    return this.list({ device_class: 'safety' });
  }

  static async getSecurityDevices(): Promise<ChildDevice[]> {
    return this.list({ device_class: 'security' });
  }

  static async getAutomationDevices(): Promise<ChildDevice[]> {
    return this.list({ device_class: 'automation' });
  }
}

// Backwards compatibility
export const ChildDevice = ChildDeviceService;