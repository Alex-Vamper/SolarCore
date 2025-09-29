import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await supabaseClient.auth.getUser(token)

    if (!user.user) {
      throw new Error('Unauthorized')
    }

    const userId = user.user.id
    console.log(`Starting account deletion for user: ${userId}`)

    // Delete all user-related data in the correct order (respecting foreign keys)
    
    // 1. Delete user notification reads
    await supabaseClient
      .from('user_notification_reads')
      .delete()
      .eq('user_id', userId)

    // 2. Delete voice response audios
    await supabaseClient
      .from('voice_response_audios')
      .delete()
      .eq('user_id', userId)

    // 3. Delete voice commands
    await supabaseClient
      .from('voice_commands')
      .delete()
      .eq('user_id', userId)

    // 4. Delete WiFi networks
    await supabaseClient
      .from('wifi_networks')
      .delete()
      .eq('user_id', userId)

    // 5. Delete user settings
    await supabaseClient
      .from('user_settings')
      .delete()
      .eq('user_id', userId)

    // 6. Delete child devices (first, due to foreign key to parent_devices)
    const { data: parentDevices } = await supabaseClient
      .from('parent_devices')
      .select('id')
      .eq('owner_account', userId)

    if (parentDevices && parentDevices.length > 0) {
      const parentIds = parentDevices.map(p => p.id)
      
      await supabaseClient
        .from('child_devices')
        .delete()
        .in('parent_id', parentIds)
    }

    // 7. Delete device audit logs
    await supabaseClient
      .from('device_audit_logs')
      .delete()
      .eq('user_id', userId)

    // 8. Delete parent devices
    await supabaseClient
      .from('parent_devices')
      .delete()
      .eq('owner_account', userId)

    // 9. Delete safety systems
    await supabaseClient
      .from('safety_systems')
      .delete()
      .eq('user_id', userId)

    // 10. Delete energy systems
    await supabaseClient
      .from('energy_systems')
      .delete()
      .eq('user_id', userId)

    // 11. Delete rooms
    await supabaseClient
      .from('rooms')
      .delete()
      .eq('user_id', userId)

    // 12. Delete launch splash seen records
    await supabaseClient
      .from('launch_splash_seen')
      .delete()
      .eq('user_id', userId)

    // 13. Delete profile
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', userId)

    // 14. Delete admin-related data if exists
    await supabaseClient
      .from('admin_users')
      .delete()
      .eq('user_id', userId)

    await supabaseClient
      .from('app_users')
      .delete()
      .eq('user_id', userId)

    // 15. Finally, delete the auth user (this will cascade to any remaining references)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      throw deleteError
    }

    console.log(`Successfully deleted account for user: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all related data deleted successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error deleting account:', error)
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Failed to delete account' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})