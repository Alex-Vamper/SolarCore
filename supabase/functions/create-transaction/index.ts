import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('Create transaction request received:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Authorization required', { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response('Authentication failed', { status: 401, headers: corsHeaders });
    }

    console.log('Authenticated user:', user.id);

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    const { plan } = requestBody;
    console.log('Payment plan requested:', plan);
    
    if (!plan || plan !== 'premium') {
      console.error('Invalid plan specified:', plan);
      return new Response('Invalid plan specified', { status: 400, headers: corsHeaders });
    }

    let userEmail;
    console.log('User email from auth:', user.email);

    // Try to get email from user_settings first, fall back to auth email
    try {
      console.log('Checking user settings for user:', user.id);
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('preferred_email')
        .eq('user_id', user.id)
        .single();

      console.log('User settings query result:', { userSettings, settingsError });

      if (settingsError) {
        console.log('Settings error (expected if no user_settings record):', settingsError.message);
      }

      if (userSettings?.preferred_email) {
        userEmail = userSettings.preferred_email;
        console.log('Using preferred email from user_settings:', userEmail);
      } else {
        // Fall back to auth email
        if (!user.email) {
          console.error('No email found in auth or user_settings for user:', user.id);
          return new Response('User email not found', { status: 400, headers: corsHeaders });
        }
        userEmail = user.email;
        console.log('Using email from auth:', userEmail);
      }
    } catch (error) {
      console.error('Error querying user_settings:', error);
      // Fall back to auth email
      if (!user.email) {
        console.error('No email found in auth for user:', user.id);
        return new Response('User email not found', { status: 400, headers: corsHeaders });
      }
      userEmail = user.email;
      console.log('Using email from auth due to error:', userEmail);
    }

    console.log('Creating transaction for email:', userEmail);

    // Premium plan pricing (in kobo - multiply NGN by 100)
    const priceInKobo = 800000; // NGN 8000 = 800,000 kobo

    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    // Clean and validate the Paystack secret key
    const cleanedSecret = paystackSecret.trim().replace(/[^\x20-\x7E]/g, '');
    console.log('Original secret length:', paystackSecret.length, 'Cleaned length:', cleanedSecret.length);
    
    if (!cleanedSecret || cleanedSecret.length < 10) {
      console.error('Invalid PAYSTACK_SECRET_KEY format');
      return new Response('Invalid payment configuration', { status: 500, headers: corsHeaders });
    }

    // Validate that the secret key looks like a valid Paystack key
    if (!cleanedSecret.startsWith('sk_')) {
      console.error('PAYSTACK_SECRET_KEY does not start with sk_');
      return new Response('Invalid payment configuration', { status: 500, headers: corsHeaders });
    }

    // Initialize Paystack transaction
    const initPayload = {
      email: userEmail,
      amount: priceInKobo,
      currency: 'NGN',
      metadata: {
        user_id: user.id,
        plan: 'premium'
      },
      callback_url: `${req.headers.get('origin') || 'http://localhost:3000'}/payment/callback`
    };

    console.log('Initializing Paystack transaction:', initPayload);

    // Make the Paystack API call with better error handling
    let paystackResponse;
    let paystackData;
    
    try {
      paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanedSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initPayload),
      });
      
      paystackData = await paystackResponse.json();
    } catch (fetchError) {
      console.error('Fetch error when calling Paystack API:', fetchError);
      console.error('Error details:', (fetchError as Error).message);
      if ((fetchError as Error).message.includes('ByteString') || (fetchError as Error).message.includes('headers')) {
        console.error('Header validation error - likely invalid characters in PAYSTACK_SECRET_KEY');
        return new Response('Payment configuration error - please contact support', { status: 500, headers: corsHeaders });
      }
      return new Response('Payment service temporarily unavailable', { status: 500, headers: corsHeaders });
    }
    
    if (!paystackResponse.ok) {
      console.error('Paystack API error:', paystackData);
      return new Response('Payment initialization failed', { status: 500, headers: corsHeaders });
    }

    console.log('Paystack transaction initialized successfully');

    return new Response(JSON.stringify({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Transaction creation error:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});