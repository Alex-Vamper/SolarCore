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

      // Look up user by email - first try preferred_email, then auth email
      let userSearch;
      let userError;
      
      // First try to find by preferred_email
      const { data: preferredEmailSearch, error: preferredEmailError } = await supabase
        .from("user_settings")
        .select("id, user_id")
        .eq("preferred_email", customerEmail)
        .limit(1);

      if (preferredEmailError) {
        console.error('Error finding user by preferred_email:', preferredEmailError);
        return new Response('Database error', { status: 500, headers: corsHeaders });
      }

      if (preferredEmailSearch && preferredEmailSearch.length > 0) {
        userSearch = preferredEmailSearch;
        console.log('Found user by preferred_email:', customerEmail);
      } else {
        console.log('No user found by preferred_email, trying auth email lookup');
        
        // Fallback: find by auth email
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error listing auth users:', authError);
          return new Response('Database error', { status: 500, headers: corsHeaders });
        }
        
        const authUser = authUsers.users.find(user => user.email === customerEmail);
        
        if (authUser) {
          console.log('Found auth user with email:', customerEmail, 'user_id:', authUser.id);
          
          // Find or create user_settings for this auth user
          const { data: settingsSearch, error: settingsError } = await supabase
            .from("user_settings")
            .select("id, user_id")
            .eq("user_id", authUser.id)
            .limit(1);
            
          if (settingsError) {
            console.error('Error finding user_settings by user_id:', settingsError);
            return new Response('Database error', { status: 500, headers: corsHeaders });
          }
          
          userSearch = settingsSearch;
          console.log('Found user_settings by user_id:', authUser.id);
        } else {
          console.log('No auth user found with email:', customerEmail);
        }
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