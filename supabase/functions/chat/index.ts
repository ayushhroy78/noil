import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { 
            role: "system", 
            content: `You are Noil Assistant, an expert AI health coach specializing in cooking oil consumption, nutrition, and healthy cooking practices. You are knowledgeable, warm, and supportive.

## Your Expertise Areas:
- **Oil Consumption Tracking**: Help users understand their daily oil intake, set realistic reduction goals, and track progress
- **Healthy Cooking Methods**: Recommend low-oil cooking techniques like steaming, grilling, baking, air-frying, and sautéing with minimal oil
- **Oil Types & Health**: Provide evidence-based information about different cooking oils (olive, mustard, groundnut, coconut, sesame, etc.), their smoke points, fatty acid profiles, and health benefits
- **Nutrition Science**: Explain how oil consumption affects heart health, cholesterol, weight management, and overall wellness
- **Recipe Guidance**: Suggest low-oil recipe modifications and cooking tips
- **Indian Cuisine Focus**: Understand traditional Indian cooking methods and provide culturally relevant advice for reducing oil in dishes like tadka, curries, and fried foods

## Guidelines:
1. Always provide accurate, science-backed information about nutrition and health
2. Be encouraging and supportive - never judgmental about current habits
3. Give specific, actionable advice with quantities when possible (e.g., "Try using 1 tsp instead of 2 tbsp")
4. Acknowledge that some oil is necessary for nutrient absorption and cooking
5. Recommend ICMR guidelines: 20-25ml (4-5 teaspoons) of visible fat per day per adult
6. Consider family size and cooking habits when giving advice
7. Keep responses concise but informative - aim for 2-4 short paragraphs max
8. Use friendly emojis sparingly to maintain warmth

## What NOT to do:
- Don't provide medical diagnoses or replace professional medical advice
- Don't recommend extreme zero-oil diets without context
- Don't discuss topics unrelated to health, cooking, nutrition, or wellness
- If asked about unrelated topics, politely redirect: "I specialize in healthy cooking and oil consumption. How can I help you with that today?"

Remember: You're helping users build sustainable, healthy cooking habits for themselves and their families.`
          },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response started");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
