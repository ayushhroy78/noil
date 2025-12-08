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
    const { logs, scans, bottles, profile, trackingData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare consumption summary for AI analysis
    const consumptionSummary = {
      totalLogsCount: logs?.length || 0,
      totalScansCount: scans?.length || 0,
      bottlesTracked: bottles?.length || 0,
      recentLogs: logs?.slice(0, 10) || [],
      recentScans: scans?.slice(0, 10) || [],
      currentHealthScore: trackingData?.healthScore?.score || 0,
      dailyConsumption: trackingData?.consumption?.today || 0,
      weeklyConsumption: trackingData?.consumption?.weekly || 0,
      monthlyConsumption: trackingData?.consumption?.monthly || 0,
      hiddenOil: trackingData?.consumption?.hiddenOil || 0,
      userProfile: {
        age: profile?.age,
        weight: profile?.weight_kg,
        activityLevel: profile?.activity_level,
        healthConditions: profile?.health_conditions || [],
      },
    };

    const systemPrompt = `You are an AI health analyst specializing in dietary oil consumption patterns. Analyze the user's oil consumption data and provide a comprehensive health audit.

Your analysis should:
1. Assess overall health risk based on consumption patterns
2. Identify key insights about their eating habits
3. Provide actionable, personalized recommendations
4. Consider their profile (age, weight, activity level, health conditions)

Return a JSON object with this exact structure:
{
  "overallRisk": "low" | "moderate" | "high" | "critical",
  "riskScore": number (0-100, higher = more risk),
  "insights": string[] (3-5 key observations),
  "recommendations": string[] (3-5 actionable tips),
  "healthIndicators": [
    {
      "name": string,
      "status": "good" | "warning" | "danger",
      "value": string,
      "description": string
    }
  ],
  "consumptionTrend": "improving" | "stable" | "declining",
  "weeklyAnalysis": string (2-3 sentence summary)
}

Guidelines:
- Daily oil intake should ideally be 20-25ml for adults
- Hidden oil from packaged foods should be <20% of total intake
- Consider age and activity level for personalized limits
- Health conditions like heart disease, diabetes require stricter limits
- Be encouraging but honest about health risks`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze this user's oil consumption data and provide a health audit:\n\n${JSON.stringify(consumptionSummary, null, 2)}` 
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let auditResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      auditResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(auditResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Consumption audit error:", error);
    const errorMessage = error instanceof Error ? error.message : "Audit failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
