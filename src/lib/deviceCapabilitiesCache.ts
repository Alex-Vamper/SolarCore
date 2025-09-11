import { User, Room, UserSettings } from "@/entities/all";
import { supabase } from "@/integrations/supabase/client";

interface DeviceCapabilities {
  hasAnderDevice: boolean;
  availableApplianceTypes: Set<string>;
  appliancesByRoom: Record<string, string[]>;
  lastUpdated: number;
}

class DeviceCapabilitiesCache {
  private cache: DeviceCapabilities | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly CACHE_KEY = 'device_capabilities_cache';

  async getCapabilities(): Promise<DeviceCapabilities> {
    // Try to get from memory cache first
    if (this.cache && Date.now() - this.cache.lastUpdated < this.CACHE_DURATION) {
      return this.cache;
    }

    // Try to get from localStorage
    const stored = localStorage.getItem(this.CACHE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.lastUpdated < this.CACHE_DURATION) {
          // Convert applianceTypes array back to Set
          this.cache = {
            ...parsed,
            availableApplianceTypes: new Set(parsed.availableApplianceTypes)
          };
          return this.cache;
        }
      } catch (error) {
        console.error('Error parsing cached capabilities:', error);
      }
    }

    // Cache is stale or doesn't exist, refresh it
    return await this.refreshCapabilities();
  }

  async refreshCapabilities(): Promise<DeviceCapabilities> {
    try {
      const currentUser = await User.me();
      const [rooms, userSettings] = await Promise.all([
        Room.filter({ created_by: currentUser.email }),
        UserSettings.list()
      ]);

      // Check if user has a valid Ander device
      let hasAnderDevice = false;
      if (userSettings.length > 0 && userSettings[0].ander_device_id) {
        try {
          const { data } = await supabase.rpc('claim_parent_device', {
            p_esp_id: userSettings[0].ander_device_id
          });
          hasAnderDevice = (data as any)?.success === true;
        } catch (error) {
          console.error('Error validating Ander device:', error);
        }
      }

      // Collect all available appliance types and organize by room
      const availableApplianceTypes = new Set<string>();
      const appliancesByRoom: Record<string, string[]> = {};

      for (const room of rooms) {
        if (room.appliances && room.appliances.length > 0) {
          const roomTypes: string[] = [];
          for (const appliance of room.appliances) {
            if (appliance.type) {
              availableApplianceTypes.add(appliance.type);
              roomTypes.push(appliance.type);
            }
          }
          if (roomTypes.length > 0) {
            appliancesByRoom[room.name.toLowerCase()] = roomTypes;
          }
        }
      }

      const capabilities: DeviceCapabilities = {
        hasAnderDevice,
        availableApplianceTypes,
        appliancesByRoom,
        lastUpdated: Date.now()
      };

      // Store in memory and localStorage
      this.cache = capabilities;
      
      // Convert Set to array for storage
      const storageData = {
        ...capabilities,
        availableApplianceTypes: Array.from(availableApplianceTypes)
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(storageData));

      return capabilities;
    } catch (error) {
      console.error('Error refreshing device capabilities:', error);
      // Return empty capabilities on error
      const fallback: DeviceCapabilities = {
        hasAnderDevice: false,
        availableApplianceTypes: new Set(),
        appliancesByRoom: {},
        lastUpdated: Date.now()
      };
      return fallback;
    }
  }

  // Clear cache when user makes changes to rooms/devices
  invalidateCache(): void {
    this.cache = null;
    localStorage.removeItem(this.CACHE_KEY);
  }

  // Check if user has devices that can respond to a specific action
  async canExecuteAction(actionType: string, roomName?: string): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    
    // Actions that require Ander device
    const anderActions = [
      'lights_all_on', 'lights_all_off', 'lights_room_on', 'lights_room_off',
      'windows_all_open', 'windows_all_close', 'windows_room_open', 'windows_room_close',
      'curtains_all_open', 'curtains_all_close', 'curtains_room_open', 'curtains_room_close',
      'ac_all_on', 'ac_all_off', 'ac_room_on', 'ac_room_off',
      'sockets_all_on', 'sockets_all_off', 'sockets_room_on', 'sockets_room_off',
      'socket_specific_on', 'socket_specific_off', 'all_devices_on', 'all_devices_off'
    ];

    if (anderActions.includes(actionType) && !capabilities.hasAnderDevice) {
      return false;
    }

    // Map action types to required appliance types
    const actionToApplianceType: Record<string, string> = {
      'lights_all_on': 'smart_lighting',
      'lights_all_off': 'smart_lighting', 
      'lights_room_on': 'smart_lighting',
      'lights_room_off': 'smart_lighting',
      'windows_all_open': 'smart_shading',
      'windows_all_close': 'smart_shading',
      'windows_room_open': 'smart_shading', 
      'windows_room_close': 'smart_shading',
      'curtains_all_open': 'smart_shading',
      'curtains_all_close': 'smart_shading',
      'curtains_room_open': 'smart_shading',
      'curtains_room_close': 'smart_shading',
      'ac_all_on': 'smart_hvac',
      'ac_all_off': 'smart_hvac',
      'ac_room_on': 'smart_hvac', 
      'ac_room_off': 'smart_hvac',
      'sockets_all_on': 'smart_socket',
      'sockets_all_off': 'smart_socket',
      'sockets_room_on': 'smart_socket',
      'sockets_room_off': 'smart_socket',
      'socket_specific_on': 'smart_socket',
      'socket_specific_off': 'smart_socket'
    };

    const requiredType = actionToApplianceType[actionType];
    if (requiredType) {
      // Check if user has appliances of this type
      if (!capabilities.availableApplianceTypes.has(requiredType)) {
        return false;
      }

      // For room-specific actions, check if the room has the required type
      if (roomName && actionType.includes('room')) {
        const roomTypes = capabilities.appliancesByRoom[roomName.toLowerCase()];
        if (!roomTypes || !roomTypes.includes(requiredType)) {
          return false;
        }
      }
    }

    return true;
  }
}

export const deviceCapabilitiesCache = new DeviceCapabilitiesCache();