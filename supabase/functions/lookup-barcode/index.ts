import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function isValidBarcode(barcode: string): boolean {
  // Barcode should be 8-14 digits only
  return /^[0-9]{8,14}$/.test(barcode);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();
    
    if (!barcode || typeof barcode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Barcode is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate barcode format
    const trimmedBarcode = barcode.trim();
    if (!isValidBarcode(trimmedBarcode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid barcode format. Must be 8-14 digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Looking up barcode: ${trimmedBarcode.substring(0, 4)}****`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query the barcode_scans table for this barcode
    const { data, error } = await supabase
      .from('barcode_scans')
      .select('product_name, oil_content_ml, fat_content_g, trans_fat_g')
      .eq('barcode', trimmedBarcode)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Database error occurred');
      throw error;
    }

    if (!data) {
      console.log('Product not found in database');
      return new Response(
        JSON.stringify({ found: false, message: 'Product not found in database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the product data
    const productData = {
      found: true,
      productName: data.product_name,
      oilContentMl: data.oil_content_ml,
      fatContentG: data.fat_content_g,
      transFatG: data.trans_fat_g,
    };

    console.log('Product found successfully');

    return new Response(
      JSON.stringify(productData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in lookup-barcode function');
    const errorMessage = error instanceof Error ? 'An error occurred while looking up the barcode' : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, found: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
