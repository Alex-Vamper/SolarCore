import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const cameraIp = url.searchParams.get('ip');
    const port = url.searchParams.get('port') || '8080';
    const path = url.searchParams.get('path') || '/';

    if (!cameraIp) {
      return new Response(JSON.stringify({ error: 'Camera IP is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(cameraIp)) {
      return new Response(JSON.stringify({ error: 'Invalid IP address format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct camera URL
    const cameraUrl = `http://${cameraIp}:${port}${path}`;
    console.log(`Proxying camera stream from: ${cameraUrl}`);

    // Fetch the camera stream
    const cameraResponse = await fetch(cameraUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SolarCore-Camera-Proxy/1.0',
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!cameraResponse.ok) {
      console.error(`Camera stream error: ${cameraResponse.status} ${cameraResponse.statusText}`);
      return new Response(JSON.stringify({ 
        error: `Camera not accessible: ${cameraResponse.status} ${cameraResponse.statusText}` 
      }), {
        status: cameraResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the content type from the camera response
    const contentType = cameraResponse.headers.get('content-type') || 'image/jpeg';
    
    // For streaming content, we need to handle it properly
    if (contentType.includes('multipart/x-mixed-replace') || contentType.includes('video/')) {
      // Handle MJPEG streams
      return new Response(cameraResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } else {
      // Handle single image requests
      const imageData = await cameraResponse.arrayBuffer();
      return new Response(imageData, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

  } catch (error) {
    console.error('Camera proxy error:', error);
    
    // Handle specific error types
    if (error.name === 'TimeoutError') {
      return new Response(JSON.stringify({ 
        error: 'Camera connection timeout. Please check if the camera is accessible.' 
      }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Response(JSON.stringify({ 
        error: 'Unable to connect to camera. Please verify the IP address and ensure the camera is on the same network.' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: `Proxy error: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});