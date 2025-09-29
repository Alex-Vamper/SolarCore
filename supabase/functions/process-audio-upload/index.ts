import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const commandId = formData.get('commandId') as string;
    const isAdmin = formData.get('isAdmin') === 'true';
    const adminPassword = formData.get('adminPassword') as string;

    if (!audioFile || !commandId) {
      return new Response(
        JSON.stringify({ error: 'Audio file and command ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user to check if they're a superadmin
    const authHeader = req.headers.get('Authorization');
    let isSuperAdmin = false;
    let userEmail = '';
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      
      if (user) {
        userEmail = user.email || '';
        // Check if user is a superadmin
        isSuperAdmin = ['samuelalexander005@gmail.com', 'samuelalexander851@gmail.com', 'ghostrevamper@gmail.com'].includes(userEmail);
      }
    }

    // Verify admin password if admin mode (legacy support)
    if (isAdmin && adminPassword !== 'Alex-Ander-1.05' && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique file path
    const fileExtension = audioFile.name.split('.').pop() || 'mp3';
    const fileName = `${commandId}_${Date.now()}.${fileExtension}`;
    const filePath = `audio-responses/${fileName}`;

    console.log('Uploading audio file:', filePath);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('ander-tts')
      .upload(filePath, audioFile, {
        contentType: audioFile.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload audio file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('ander-tts')
      .getPublicUrl(uploadData.path);

    const audioUrl = urlData.publicUrl;
    console.log('Generated audio URL:', audioUrl);

    // Update voice command with audio URL
    const { error: updateError } = await supabaseClient
      .from('voice_commands')
      .update({ 
        audio_url: audioUrl,
        is_global: isAdmin 
      })
      .eq('id', commandId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update command with audio URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If superadmin upload, propagate to all users (global effect)
    if (isAdmin || isSuperAdmin) {
      console.log('Superadmin upload detected, propagating globally...');
      
      // Get the command details
      const { data: commandData, error: commandError } = await supabaseClient
        .from('voice_commands')
        .select('command_category, command_name, keywords, response')
        .eq('id', commandId)
        .single();

      if (!commandError && commandData) {
        // Update all matching commands across all users
        const { error: globalUpdateError } = await supabaseClient
          .from('voice_commands')
          .update({ audio_url: audioUrl, is_global: true })
          .eq('command_category', commandData.command_category)
          .eq('command_name', commandData.command_name);

        if (globalUpdateError) {
          console.error('Global update error:', globalUpdateError);
        } else {
          console.log('Successfully propagated audio to all users from superadmin:', userEmail);
        }
      }
    }

    // Create voice response audio record
    const { error: audioRecordError } = await supabaseClient
      .from('voice_response_audios')
      .insert({
        command_id: commandId,
        storage_path: uploadData.path,
        provider: 'user_upload',
        transcript: null,
        format: fileExtension,
        duration_seconds: null
      });

    if (audioRecordError) {
      console.error('Audio record error:', audioRecordError);
      // Don't fail the whole operation for this
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl,
        message: isAdmin ? 'Audio uploaded and propagated globally' : 'Audio uploaded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process audio upload error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});