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
    const { ingredients, cuisine, mealType } = await req.json();
    
    if (!ingredients) {
      return new Response(
        JSON.stringify({ error: 'Ingredients are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a nutritionist and chef specializing in LOW-OIL and HEALTHY cooking methods. 
Your goal is to create recipes that minimize oil usage while maintaining flavor and nutrition.

IMPORTANT LOW-OIL PRINCIPLES:
- Prefer: grilling, baking, steaming, air-frying, sautéing with minimal oil
- Avoid: deep frying, excessive oil for tadka/tempering
- Maximum oil per recipe: 15ml (1 tablespoon)
- Suggest oil alternatives: water sautéing, vegetable stock, non-stick pans
- Focus on natural flavors from spices, herbs, and cooking techniques

Output format must be valid JSON with this structure:
{
  "name": "Recipe name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "steps": ["step 1", "step 2"],
  "oil_estimate_ml": number (max 15),
  "cooking_method": "primary cooking method used",
  "health_benefits": "brief description of health benefits",
  "calories_approx": number
}`;

    const userPrompt = `Create a LOW-OIL recipe using these ingredients: ${ingredients}
${cuisine ? `Cuisine style: ${cuisine}` : ''}
${mealType ? `Meal type: ${mealType}` : ''}

Requirements:
- Use MINIMAL oil (max 15ml total)
- Focus on healthy cooking methods (grilling, baking, steaming, air-frying)
- Make it flavorful using spices and herbs instead of oil
- Provide step-by-step instructions
- Include approximate calories`;

    console.log('Calling Lovable AI for recipe generation...');
    
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
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
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

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const recipeText = data.choices[0].message.content;
    const recipe = JSON.parse(recipeText);

    console.log('Recipe generated successfully:', recipe.name);

    return new Response(
      JSON.stringify({ success: true, recipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate recipe' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
