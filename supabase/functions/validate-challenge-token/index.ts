import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { challenge_id, entered_token } = body;

    if (!challenge_id || !entered_token) {
      return new Response(
        JSON.stringify({ error: 'challenge_id and entered_token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating token for user ${user.id}, challenge ${challenge_id}`);

    // Lookup the latest active token for this user/challenge
    const { data: tokenData, error: fetchError } = await supabaseClient
      .from('challenge_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_id', challenge_id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching token:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation checks
    if (!tokenData) {
      console.log('No active token found');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'No active verification code found. Please generate a new code and try again.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token matches (case-insensitive)
    const normalizedEntered = entered_token.trim().toUpperCase();
    const normalizedStored = tokenData.token.toUpperCase();

    if (normalizedEntered !== normalizedStored) {
      console.log('Token mismatch:', normalizedEntered, '!==', normalizedStored);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Verification code does not match. Please check the code you wrote and try again.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Token is valid - mark as used
    const { error: updateError } = await supabaseClient
      .from('challenge_tokens')
      .update({ 
        status: 'used', 
        used_at: new Date().toISOString() 
      })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
      // Token was valid, continue anyway
    }

    console.log('Token validated successfully');

    return new Response(
      JSON.stringify({ 
        valid: true,
        token_id: tokenData.id,
        message: 'Verification successful! Your photo has been verified with the dynamic code.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in validate-challenge-token:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while validating token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
