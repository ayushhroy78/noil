import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();
    
    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Looking up barcode: ${barcode}`);

    // Query Open Food Facts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 0) {
      return new Response(
        JSON.stringify({ found: false, message: 'Product not found in database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const product = data.product;
    
    // Extract nutritional information
    const nutritionData = {
      found: true,
      productName: product.product_name || product.generic_name || 'Unknown Product',
      brand: product.brands || '',
      // Calculate oil content from fat (approximate: 1g fat ≈ 1ml oil)
      oilContentMl: product.nutriments?.fat_100g ? Math.round(product.nutriments.fat_100g) : null,
      fatContentG: product.nutriments?.fat_100g || null,
      transFatG: product.nutriments?.['trans-fat_100g'] || null,
      servingSize: product.serving_size || product.quantity || '',
      imageUrl: product.image_url || null,
    };

    console.log('Product lookup result:', nutritionData);

    return new Response(
      JSON.stringify(nutritionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in lookup-barcode function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, found: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
