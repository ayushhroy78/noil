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
    const { productName, oilContentMl, fatContentG, transFatG } = await req.json();
    
    if (!productName || !oilContentMl) {
      return new Response(
        JSON.stringify({ error: 'Product name and oil content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating oil alternatives for: ${productName}`);

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

    const userPrompt = `A user scanned "${productName}" which contains:
- Oil content: ${oilContentMl}ml
${fatContentG ? `- Total fat: ${fatContentG}g` : ''}
${transFatG ? `- Trans fat: ${transFatG}g` : ''}

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
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI suggestions');
    }

    const aiData = await response.json();
    const suggestions = aiData.choices[0]?.message?.content || 'No suggestions available';

    console.log('AI suggestions generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        suggestions,
        productName,
        oilContentMl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-oil-alternatives function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
