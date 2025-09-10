import { supabase } from '@/integrations/supabase/client';

export interface WiFiNetwork {
  id: string;
  user_id: string;
  ssid: string;
  password: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class WiFiNetworkService {
  static async list(): Promise<WiFiNetwork[]> {
    const { data, error } = await supabase
      .from('wifi_networks')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching WiFi networks:', error);
      throw error;
    }

    return data || [];
  }

  static async create(network: Omit<WiFiNetwork, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<WiFiNetwork> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('wifi_networks')
      .insert({
        ...network,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating WiFi network:', error);
      throw error;
    }

    return data;
  }

  static async update(id: string, updates: Partial<WiFiNetwork>): Promise<WiFiNetwork> {
    const { data, error } = await supabase
      .from('wifi_networks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating WiFi network:', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('wifi_networks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting WiFi network:', error);
      throw error;
    }
  }

  static async updatePriorities(networks: Array<{ id: string; priority: number }>): Promise<void> {
    const updates = networks.map(network => 
      supabase
        .from('wifi_networks')
        .update({ priority: network.priority })
        .eq('id', network.id)
    );

    const results = await Promise.all(updates);
    
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating WiFi network priorities:', errors);
      throw new Error('Failed to update network priorities');
    }
  }

  static async sendToDevices(): Promise<void> {
    try {
      const networks = await this.list();
      const activeNetworks = networks.filter(n => n.is_active);
      
      // Call MQTT bridge to send WiFi configuration to devices
      const { data, error } = await supabase.functions.invoke('mqtt-bridge', {
        body: {
          action: 'configure_wifi_networks',
          data: {
            networks: activeNetworks.map(network => ({
              ssid: network.ssid,
              password: network.password,
              priority: network.priority
            }))
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error sending WiFi networks to devices:', error);
      throw error;
    }
  }
}

export const WiFiNetwork = WiFiNetworkService;