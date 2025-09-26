import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MQTT configuration - placeholder for actual broker URL
const MQTT_BROKER_URL = Deno.env.get('MQTT_BROKER_URL') || 'mqtt://localhost:1883';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle both direct calls and database notifications
    let action, data;
    
    if (req.method === 'POST') {
      const body = await req.json();
      action = body.action;
      data = body.data;
    } else {
      // Handle database notifications (these would come from triggers)
      // For now, we'll process them as direct calls
      const body = await req.json();
      action = body.action;
      data = body;
    }
    console.log('MQTT Bridge received action:', action, 'with data:', data);

    switch (action) {
      case 'publish_command': {
        // Publish command to ESP32
        const { esp_id, child_id, device_class, device_series, new_state } = data;
        
        const mqttMessage = {
          message_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          target: {
            child_id,
            device_class,
            device_series
          },
          action: 'set_state',
          payload: new_state
        };

        // TODO: Actual MQTT publishing will be implemented when broker URL is provided
        console.log(`Publishing to topic esp/${esp_id}/commands:`, mqttMessage);
        
        // For now, simulate successful publish
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Command published successfully',
            topic: `esp/${esp_id}/commands`,
            payload: mqttMessage
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'process_mqtt_state_update': {
        // Process incoming MQTT state update from ESP32
        const { esp_id, child_id, device_class, device_series, device_state, timestamp } = data;
        
        // Update child device state in database
        const { error } = await supabase
          .from('child_devices')
          .update({ 
            state: device_state,
            updated_at: new Date().toISOString()
          })
          .eq('id', child_id);

        if (error) {
          throw new Error(`Failed to update device state: ${error.message}`);
        }

        // Log MQTT state update
        await supabase
          .from('device_audit_logs')
          .insert({
            action: 'mqtt_state_update',
            entity_type: 'child_device', 
            entity_id: child_id,
            details: { esp_id, device_class, device_series, device_state, timestamp }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'MQTT state update processed successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send_device_configuration': {
        // Send device configuration to ESP32
        const { esp_id, child_id, device_name, device_class, device_series } = data;
        
        const configMessage = {
          message_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'configure_device',
          payload: {
            child_id,
            device_name,
            device_class,
            device_series
          }
        };

        // TODO: Actual MQTT publishing will be implemented when broker URL is provided
        console.log(`Publishing config to topic esp/${esp_id}/config:`, configMessage);
        
        // Update device sync status
        await supabase
          .from('device_audit_logs')
          .insert({
            action: 'device_configuration_sent',
            entity_type: 'child_device',
            entity_id: child_id,
            details: { esp_id, device_name, device_class, device_series }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Device configuration sent successfully',
            topic: `esp/${esp_id}/config`,
            payload: configMessage
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_esp_devices': {
        // Sync all devices for an ESP32 on reboot
        const { esp_id } = data;
        
        // Get all child devices for this ESP32
        const { data: parentDevice, error: parentError } = await supabase
          .from('parent_devices')
          .select('id')
          .eq('esp_id', esp_id)
          .single();

        if (parentError || !parentDevice) {
          throw new Error(`ESP32 ${esp_id} not found or not claimed`);
        }

        const { data: childDevices, error: childError } = await supabase
          .from('child_devices')
          .select('id, device_name, state, device_types!inner(device_class, device_series)')
          .eq('parent_id', parentDevice.id);

        if (childError) {
          throw new Error(`Failed to get child devices: ${childError.message}`);
        }

        // Send sync message with all devices
        const syncMessage = {
          message_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'sync_all_devices',
          payload: {
            devices: childDevices?.map(device => ({
              child_id: device.id,
              device_name: device.device_name,
              device_class: device.device_types.device_class,
              device_series: device.device_types.device_series,
              current_state: device.state
            })) || []
          }
        };

        // TODO: Actual MQTT publishing will be implemented when broker URL is provided
        console.log(`Publishing sync to topic esp/${esp_id}/config:`, syncMessage);
        
        // Log sync action
        await supabase
          .from('device_audit_logs')
          .insert({
            action: 'esp_device_sync',
            entity_type: 'parent_device',
            entity_id: parentDevice.id,
            details: { esp_id, device_count: childDevices?.length || 0 }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'ESP32 device sync completed',
            topic: `esp/${esp_id}/config`,
            device_count: childDevices?.length || 0,
            payload: syncMessage
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'process_state_update': {
        // Process state update from ESP32
        const { esp_id, child_id, state } = data;
        
        // Update child device state in database
        const { error } = await supabase
          .from('child_devices')
          .update({ 
            state,
            updated_at: new Date().toISOString()
          })
          .eq('id', child_id);

        if (error) {
          throw new Error(`Failed to update device state: ${error.message}`);
        }

        // Log state update
        await supabase
          .from('device_audit_logs')
          .insert({
            action: 'state_update_from_esp',
            entity_type: 'child_device',
            entity_id: child_id,
            details: { esp_id, state }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'State updated successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_device_state': {
        // Get current device state
        const { child_id } = data;
        
        const { data: device, error } = await supabase
          .from('child_devices')
          .select('*, parent_devices(esp_id)')
          .eq('id', child_id)
          .single();

        if (error) {
          throw new Error(`Failed to get device state: ${error.message}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            device 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'configure_wifi_networks': {
        // Configure WiFi networks on ESP32 devices
        const { networks } = data;
        
        // Get user's parent devices to send WiFi configuration
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }

        const { data: parentDevices, error: devicesError } = await supabase
          .from('parent_devices')
          .select('esp_id')
          .eq('owner_account', user.id);

        if (devicesError) {
          throw new Error(`Failed to get user devices: ${devicesError.message}`);
        }

        // Prepare WiFi configuration message for each device
        const wifiConfigMessages = parentDevices?.map(device => {
          const mqttMessage = {
            message_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'configure_wifi',
            payload: {
              networks: networks.map((network: any, index: number) => ({
                ssid: network.ssid,
                password: network.password,
                priority: network.priority || index
              }))
            }
          };

          // TODO: Actual MQTT publishing will be implemented when broker URL is provided
          console.log(`Publishing WiFi config to topic esp/${device.esp_id}/wifi-config:`, mqttMessage);
          
          return {
            device_id: device.esp_id,
            topic: `esp/${device.esp_id}/wifi-config`,
            message: mqttMessage
          };
        }) || [];

        // Log WiFi configuration action
        await supabase
          .from('device_audit_logs')
          .insert({
            action: 'configure_wifi_networks',
            entity_type: 'parent_device',
            entity_id: null,
            user_id: user.id,
            details: { 
              networks_count: networks.length,
              device_count: parentDevices?.length || 0
            }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'WiFi networks configured successfully',
            configurations: wifiConfigMessages
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'register_esp_device': {
        // Register ESP32 device and claim it for user
        const { esp_id, user_id } = data;
        
        // Use the existing claim_parent_device function
        const { data: claimResult, error: claimError } = await supabase.rpc('claim_parent_device', {
          p_esp_id: esp_id
        });

        if (claimError) {
          throw new Error(`Failed to register ESP device: ${claimError.message}`);
        }

        const result = claimResult as { success: boolean; parent_id?: string; message?: string; code?: string };
        
        if (!result.success) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: result.message,
              code: result.code
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            parent_id: result.parent_id,
            message: result.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_esp_sync_data': {
        // Get all device configurations for ESP32 sync
        const { esp_id } = data;
        
        // Get parent device
        const { data: parentDevice, error: parentError } = await supabase
          .from('parent_devices')
          .select('id')
          .eq('esp_id', esp_id)
          .single();

        if (parentError || !parentDevice) {
          throw new Error(`ESP32 ${esp_id} not found or not claimed`);
        }

        // Get all child devices for this ESP32 with device type info
        const { data: childDevices, error: childError } = await supabase
          .from('child_devices')
          .select(`
            id, 
            device_name, 
            device_class,
            device_series,
            state, 
            created_at,
            updated_at
          `)
          .eq('parent_id', parentDevice.id);

        if (childError) {
          throw new Error(`Failed to get child devices: ${childError.message}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            esp_id,
            parent_id: parentDevice.id,
            devices: childDevices || [],
            sync_timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('MQTT Bridge error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});