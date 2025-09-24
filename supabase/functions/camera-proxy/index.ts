import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle different request methods
    if (req.method === 'GET') {
      // Legacy URL parameter method for direct streaming
      return await handleStreamRequest(req);
    } 
    else if (req.method === 'POST') {
      // New JSON-based method for validation and discovery
      return await handleApiRequest(req);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Camera proxy error:', error);
    return handleError(error);
  }
});

// Handle streaming requests (GET method)
async function handleStreamRequest(req: Request) {
  const url = new URL(req.url);
  const cameraIp = url.searchParams.get('ip');
  const port = url.searchParams.get('port') || '8080';
  const path = url.searchParams.get('path') || '/video';

  if (!cameraIp) {
    return new Response(JSON.stringify({ error: 'Camera IP is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate IP format
  if (!validateIpFormat(cameraIp)) {
    return new Response(JSON.stringify({ error: 'Invalid IP address format' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return await streamCameraFeed(cameraIp, port, path);
}

// Handle API requests (POST method)
async function handleApiRequest(req: Request) {
  const body = await req.json();
  const { cameraIp, port = 8080, path = '/video', action = 'stream' } = body;

  if (!cameraIp) {
    return new Response(JSON.stringify({ error: 'Camera IP is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!validateIpFormat(cameraIp)) {
    return new Response(JSON.stringify({ error: 'Invalid IP address format' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  switch (action) {
    case 'validate':
      return await validateCamera(cameraIp, port, path);
    case 'discover':
      return await discoverCapabilities(cameraIp, port);
    case 'stream':
    default:
      const baseUrl = new URL(req.url).origin;
      const proxyUrl = `${baseUrl}/functions/v1/camera-proxy?ip=${encodeURIComponent(cameraIp)}&port=${port}&path=${encodeURIComponent(path)}`;
      return new Response(JSON.stringify({ proxyUrl }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

// Stream camera feed directly
async function streamCameraFeed(cameraIp: string, port: string, path: string) {
  const cameraUrl = `http://${cameraIp}:${port}${path}`;
  console.log(`Streaming camera feed from: ${cameraUrl}`);

  const cameraResponse = await fetch(cameraUrl, {
    method: 'GET',
    headers: { 'User-Agent': 'SolarCore-Camera-Proxy/1.0' },
    signal: AbortSignal.timeout(10000),
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

  const contentType = cameraResponse.headers.get('content-type') || 'image/jpeg';
  
  if (contentType.includes('multipart/x-mixed-replace') || contentType.includes('video/')) {
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
}

// Validate camera connection
async function validateCamera(cameraIp: string, port: number, path: string) {
  const startTime = Date.now();
  const cameraUrl = `http://${cameraIp}:${port}${path}`;
  
  console.log(`Validating camera at: ${cameraUrl}`);

  try {
    const response = await fetch(cameraUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'SolarCore-Camera-Proxy/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    const responseTime = Date.now() - startTime;
    const isValid = response.ok;
    
    let quality: string;
    if (responseTime < 1000) quality = 'excellent';
    else if (responseTime < 3000) quality = 'good';
    else if (responseTime < 8000) quality = 'poor';
    else quality = 'unknown';

    const capabilities = isValid ? await discoverBasicCapabilities(cameraIp, port) : {};

    return new Response(JSON.stringify({
      isValid,
      quality,
      responseTime,
      capabilities,
      error: isValid ? null : `HTTP ${response.status}: ${response.statusText}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error.name === 'TimeoutError' 
      ? 'Connection timeout' 
      : error.message || 'Connection failed';

    return new Response(JSON.stringify({
      isValid: false,
      quality: 'unknown',
      responseTime: Date.now() - startTime,
      capabilities: {},
      error: errorMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Discover camera capabilities
async function discoverCapabilities(cameraIp: string, port: number) {
  const capabilities = await discoverBasicCapabilities(cameraIp, port);
  
  return new Response(JSON.stringify({ capabilities }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Basic capability discovery
async function discoverBasicCapabilities(cameraIp: string, port: number) {
  const capabilities: Record<string, any> = {
    discovered_at: new Date().toISOString(),
    endpoints: []
  };

  const commonPaths = ['/video', '/shot.jpg', '/videostream.cgi', '/axis-cgi/jpg/image.cgi'];
  
  for (const path of commonPaths) {
    try {
      const response = await fetch(`http://${cameraIp}:${port}${path}`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'SolarCore-Camera-Proxy/1.0' },
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        capabilities.endpoints.push({
          path,
          contentType: response.headers.get('content-type') || 'unknown',
          status: response.status
        });
      }
    } catch {
      // Ignore errors for individual endpoint checks
    }
  }

  return capabilities;
}

// Validate IP address format
function validateIpFormat(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Handle errors
function handleError(error: any) {
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