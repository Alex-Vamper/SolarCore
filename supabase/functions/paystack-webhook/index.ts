import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('Webhook request received:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    
    console.log('Webhook payload received, signature:', signature.substring(0, 20) + '...');

    // Verify signature using Web Crypto API (Node.js crypto not available in Deno)
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    // Create HMAC-SHA512 hash
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(paystackSecret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signature_buffer = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
    const hash = Array.from(new Uint8Array(signature_buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    console.log('Webhook signature verified successfully');

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    console.log('Processing event:', event);

    // Only process successful charges
    if (event === "charge.success") {
      const reference = data.reference;
      const amountKobo = data.amount;
      const customerEmail = data.customer?.email;
      const metadata = data.metadata || {};

      console.log('Processing successful charge:', { reference, amountKobo, customerEmail });

      // Initialize Supabase client with service role key
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase configuration missing');
        return new Response('Server configuration error', { status: 500, headers: corsHeaders });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Look up user by email
      const { data: userSearch, error: userError } = await supabase
        .from("user_settings")
        .select("id, user_id")
        .eq("preferred_email", customerEmail)
        .limit(1);

      if (userError) {
        console.error('Error finding user:', userError);
        return new Response('Database error', { status: 500, headers: corsHeaders });
      }

      if (userSearch && userSearch.length > 0) {
        const userSettings = userSearch[0];
        
        // Set subscription fields (30 days for premium)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);

        const { error: updateError } = await supabase
          .from("user_settings")
          .update({
            subscription_plan: "premium",
            subscription_end_date: expiry.toISOString(),
            subscription_start_date: new Date().toISOString(),
            subscription_status: "active",
            paystack_reference: reference,
            subscription_amount_kobo: amountKobo,
            paystack_customer_code: data.customer?.customer_code
          })
          .eq("id", userSettings.id);

        if (updateError) {
          console.error('Error updating user subscription:', updateError);
          return new Response('Database update error', { status: 500, headers: corsHeaders });
        }

        console.log('Successfully updated user subscription for:', customerEmail);
      } else {
        console.log('User not found for email:', customerEmail);
      }
    } else {
      console.log('Ignoring event:', event);
    }

    return new Response('Webhook processed successfully', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});