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

    const { plan } = await req.json();
    console.log('Payment plan requested:', plan);
    
    if (!plan || plan !== 'premium') {
      console.error('Invalid plan specified:', plan);
      return new Response('Invalid plan specified', { status: 400, headers: corsHeaders });
    }

    // First check if user_settings table exists and get user email from auth
    console.log('Checking user settings for user:', user.id);
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('preferred_email')
      .eq('user_id', user.id)
      .single();

    console.log('User settings query result:', { userSettings, settingsError });

    let userEmail;
    if (settingsError || !userSettings?.preferred_email) {
      console.log('No preferred email in user_settings, using auth email:', user.email);
      // Fallback to auth email if user_settings doesn't have preferred_email
      if (!user.email) {
        console.error('No email found in auth or user_settings for user:', user.id);
        return new Response('User email not found', { status: 400, headers: corsHeaders });
      }
      userEmail = user.email;
    } else {
      userEmail = userSettings.preferred_email;
    }

    console.log('Creating transaction for:', userEmail);

    // Premium plan pricing (in kobo - multiply NGN by 100)
    const priceInKobo = 2000000; // NGN 20,000 = 2,000,000 kobo

    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
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

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(initPayload),
    });

    const paystackData = await paystackResponse.json();
    
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