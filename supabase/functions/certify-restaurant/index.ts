import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple deterministic hash function using Web Crypto API
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a mock transaction hash (simulates blockchain tx)
function generateTxHash(): string {
  const timestamp = Date.now().toString(16);
  const random = crypto.randomUUID().replace(/-/g, '');
  return `0x${timestamp}${random}`.slice(0, 66);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { restaurantId, restaurantData } = await req.json();

    if (!restaurantId || !restaurantData) {
      return new Response(
        JSON.stringify({ error: 'Missing restaurantId or restaurantData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Certifying restaurant:', restaurantId);

    // Build deterministic certification metadata
    const certificationMetadata = {
      id: restaurantData.id,
      name: restaurantData.restaurant_name,
      city: restaurantData.city,
      state: restaurantData.state,
      oil_types: restaurantData.oil_types?.sort() || [],
      cooking_methods: restaurantData.cooking_methods?.sort() || [],
      certifications: restaurantData.certifications?.sort() || [],
      approved_at: restaurantData.approved_at || new Date().toISOString(),
    };

    // Sort keys for deterministic JSON
    const sortedMetadata = JSON.stringify(certificationMetadata, Object.keys(certificationMetadata).sort());
    
    // Generate hash of certification data
    const certificationHash = await generateHash(sortedMetadata);
    console.log('Generated certification hash:', certificationHash);

    // Generate mock transaction hash (in production, this would be a real blockchain tx)
    const txHash = generateTxHash();
    const network = 'lovable-testnet';
    const certifiedAt = new Date().toISOString();

    console.log('Mock blockchain transaction:', txHash);

    // Update database with certification info
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('restaurant_applications')
      .update({
        blockchain_certified: true,
        blockchain_hash: certificationHash,
        blockchain_tx_hash: txHash,
        blockchain_network: network,
        blockchain_certified_at: certifiedAt,
      })
      .eq('id', restaurantId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update certification status',
          details: updateError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Restaurant certified successfully');

    return new Response(
      JSON.stringify({
        success: true,
        certification: {
          hash: certificationHash,
          txHash: txHash,
          network: network,
          certifiedAt: certifiedAt,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Certification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Certification failed',
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
