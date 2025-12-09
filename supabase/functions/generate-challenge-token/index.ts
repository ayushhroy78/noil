import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random 4-digit token prefixed with NOIL
function generateToken(): string {
  const digits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `NOIL-${digits}`;
}

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
    const { challenge_id, user_challenge_id } = body;

    if (!challenge_id || !user_challenge_id) {
      return new Response(
        JSON.stringify({ error: 'challenge_id and user_challenge_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating token for user ${user.id}, challenge ${challenge_id}`);

    // First, expire any existing active tokens for this user/challenge
    const { error: expireError } = await supabaseClient
      .from('challenge_tokens')
      .update({ status: 'expired' })
      .eq('user_id', user.id)
      .eq('challenge_id', challenge_id)
      .eq('status', 'active');

    if (expireError) {
      console.error('Error expiring old tokens:', expireError);
      // Continue anyway, unique constraint will handle it
    }

    // Generate new token
    const token = generateToken();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 10 * 60 * 1000); // 10 minutes

    // Insert new token
    const { data: tokenData, error: insertError } = await supabaseClient
      .from('challenge_tokens')
      .insert({
        user_id: user.id,
        challenge_id,
        user_challenge_id,
        token,
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting token:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate token. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token generated successfully:', token);

    return new Response(
      JSON.stringify({
        success: true,
        token: tokenData.token,
        issued_at: tokenData.issued_at,
        expires_at: tokenData.expires_at,
        display_time: issuedAt.toLocaleString('en-IN', { 
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        }),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-challenge-token:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while generating token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
