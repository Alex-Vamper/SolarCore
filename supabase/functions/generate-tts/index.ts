import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voiceId = "9BWtsMINqrJLrRacOk9x", commandId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Get ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Generate speech using ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for easy handling
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    // Optionally store in Supabase if user is authenticated
    if (commandId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        try {
          // Initialize Supabase client
          const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
              global: {
                headers: { Authorization: authHeader },
              },
            }
          );

          // Get current user
          const { data: { user } } = await supabaseClient.auth.getUser();
          
          if (user) {
            // Generate unique filename
            const filename = `${user.id}/${commandId}_${Date.now()}.mp3`;
            
            // Upload to storage
            const { error: uploadError } = await supabaseClient.storage
              .from('ander-tts')
              .upload(filename, audioBuffer, {
                contentType: 'audio/mpeg',
              });

            if (!uploadError) {
              // Save record to voice_response_audios table
              await supabaseClient
                .from('voice_response_audios')
                .insert({
                  user_id: user.id,
                  command_id: commandId,
                  provider: 'elevenlabs',
                  voice_id: voiceId,
                  format: 'mp3',
                  storage_path: filename,
                  transcript: text,
                });
            }
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Continue anyway, don't fail the request
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('TTS generation error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});