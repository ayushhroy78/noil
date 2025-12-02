import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_PRODUCT_NAME_LENGTH = 200;
const MAX_OIL_CONTENT = 10000; // ml

// Sanitize string input for AI prompt
function sanitizeForPrompt(input: string, maxLength: number): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>{}]/g, '') // Remove potentially harmful characters
    .replace(/\n+/g, ' '); // Replace newlines with spaces
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { productName, oilContentMl, fatContentG, transFatG } = body;
    
    // Validate required fields
    if (!productName || typeof productName !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Product name is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (oilContentMl === undefined || typeof oilContentMl !== 'number' || oilContentMl < 0 || oilContentMl > MAX_OIL_CONTENT) {
      return new Response(
        JSON.stringify({ error: `Oil content must be a number between 0 and ${MAX_OIL_CONTENT}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedProductName = sanitizeForPrompt(productName, MAX_PRODUCT_NAME_LENGTH);
    const sanitizedFatContent = typeof fatContentG === 'number' && fatContentG >= 0 ? fatContentG : null;
    const sanitizedTransFat = typeof transFatG === 'number' && transFatG >= 0 ? transFatG : null;

    console.log('Generating oil alternatives for product');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare the prompt for AI
    const systemPrompt = `You are a nutrition expert specializing in healthy cooking oils. Your role is to suggest healthier oil alternatives based on the nutritional content of packaged foods. Focus on:
- Recommending oils with better health profiles (cold-pressed, unrefined, low trans-fat)
- Explaining why each alternative is healthier
- Considering the oil quantity in the product
- Being practical and realistic in suggestions`;

    const userPrompt = `A user scanned a product "${sanitizedProductName}" which contains:
- Oil content: ${oilContentMl}ml
${sanitizedFatContent !== null ? `- Total fat: ${sanitizedFatContent}g` : ''}
${sanitizedTransFat !== null ? `- Trans fat: ${sanitizedTransFat}g` : ''}

Suggest 2-3 healthier oil alternatives that could be used instead. For each suggestion, provide:
1. Oil name (e.g., "Extra Virgin Olive Oil", "Cold-pressed Mustard Oil")
2. A brief explanation (1-2 sentences) of why it's healthier
3. Health rating (A for best, B for good, C for acceptable)

Keep suggestions practical and concise.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('AI gateway error:', response.status);
      throw new Error('Failed to get AI suggestions');
    }

    const aiData = await response.json();
    const suggestions = aiData.choices[0]?.message?.content || 'No suggestions available';

    console.log('AI suggestions generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        suggestions,
        productName: sanitizedProductName,
        oilContentMl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-oil-alternatives function');
    return new Response(
      JSON.stringify({ error: 'An error occurred while generating suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
