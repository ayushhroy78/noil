import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackingSummary {
  today: {
    total_oil_ml: number;
    cooking_oil_ml: number;
    hidden_oil_ml: number;
    trans_fat_g: number;
    log_count: number;
    scan_count: number;
  };
  weekly: {
    total_oil_ml: number;
    cooking_oil_ml: number;
    hidden_oil_ml: number;
    trans_fat_g: number;
    avg_daily_ml: number;
  };
  monthly: {
    total_oil_ml: number;
    cooking_oil_ml: number;
    hidden_oil_ml: number;
    trans_fat_g: number;
    avg_daily_ml: number;
  };
  bottles: {
    active_count: number;
    total_quantity_ml: number;
    avg_daily_from_bottles: number;
  };
  health_score: number | null;
  oil_type_breakdown: Record<string, number>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Parallel queries for performance
    const [
      todayAggResult,
      weeklyAggResult,
      monthlyAggResult,
      bottlesResult,
      healthScoreResult,
      oilTypeResult
    ] = await Promise.all([
      // Today's aggregates
      supabase
        .from("user_daily_aggregates")
        .select("total_oil_ml, cooking_oil_ml, hidden_oil_ml, trans_fat_g, log_count, scan_count")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle(),

      // Weekly aggregates (last 7 days)
      supabase
        .from("user_daily_aggregates")
        .select("total_oil_ml, cooking_oil_ml, hidden_oil_ml, trans_fat_g")
        .eq("user_id", userId)
        .gte("date", weekAgo)
        .lte("date", today),

      // Monthly aggregates (last 30 days)
      supabase
        .from("user_daily_aggregates")
        .select("total_oil_ml, cooking_oil_ml, hidden_oil_ml, trans_fat_g")
        .eq("user_id", userId)
        .gte("date", monthAgo)
        .lte("date", today),

      // Active bottles
      supabase
        .from("bottles")
        .select("quantity_ml, avg_daily_consumption")
        .eq("user_id", userId)
        .is("finish_date", null),

      // Latest health score
      supabase
        .from("health_scores")
        .select("score")
        .eq("user_id", userId)
        .order("score_date", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Oil type breakdown for today (from daily_logs)
      supabase
        .from("daily_logs")
        .select("oil_type, amount_ml")
        .eq("user_id", userId)
        .eq("log_date", today)
    ]);

    // Process today's data
    const todayData = todayAggResult.data || {
      total_oil_ml: 0,
      cooking_oil_ml: 0,
      hidden_oil_ml: 0,
      trans_fat_g: 0,
      log_count: 0,
      scan_count: 0
    };

    // Process weekly data
    const weeklyData = weeklyAggResult.data || [];
    const weeklyTotals = weeklyData.reduce(
      (acc, row) => ({
        total_oil_ml: acc.total_oil_ml + Number(row.total_oil_ml || 0),
        cooking_oil_ml: acc.cooking_oil_ml + Number(row.cooking_oil_ml || 0),
        hidden_oil_ml: acc.hidden_oil_ml + Number(row.hidden_oil_ml || 0),
        trans_fat_g: acc.trans_fat_g + Number(row.trans_fat_g || 0),
      }),
      { total_oil_ml: 0, cooking_oil_ml: 0, hidden_oil_ml: 0, trans_fat_g: 0 }
    );

    // Process monthly data
    const monthlyData = monthlyAggResult.data || [];
    const monthlyTotals = monthlyData.reduce(
      (acc, row) => ({
        total_oil_ml: acc.total_oil_ml + Number(row.total_oil_ml || 0),
        cooking_oil_ml: acc.cooking_oil_ml + Number(row.cooking_oil_ml || 0),
        hidden_oil_ml: acc.hidden_oil_ml + Number(row.hidden_oil_ml || 0),
        trans_fat_g: acc.trans_fat_g + Number(row.trans_fat_g || 0),
      }),
      { total_oil_ml: 0, cooking_oil_ml: 0, hidden_oil_ml: 0, trans_fat_g: 0 }
    );

    // Process bottles data
    const bottles = bottlesResult.data || [];
    const bottlesSummary = {
      active_count: bottles.length,
      total_quantity_ml: bottles.reduce((sum, b) => sum + Number(b.quantity_ml || 0), 0),
      avg_daily_from_bottles: bottles.reduce((sum, b) => sum + Number(b.avg_daily_consumption || 0), 0),
    };

    // Process oil type breakdown
    const oilTypeBreakdown: Record<string, number> = {};
    (oilTypeResult.data || []).forEach((log) => {
      const type = log.oil_type || "other";
      oilTypeBreakdown[type] = (oilTypeBreakdown[type] || 0) + Number(log.amount_ml || 0);
    });

    // Build response
    const summary: TrackingSummary = {
      today: {
        total_oil_ml: Number(todayData.total_oil_ml) || 0,
        cooking_oil_ml: Number(todayData.cooking_oil_ml) || 0,
        hidden_oil_ml: Number(todayData.hidden_oil_ml) || 0,
        trans_fat_g: Number(todayData.trans_fat_g) || 0,
        log_count: Number(todayData.log_count) || 0,
        scan_count: Number(todayData.scan_count) || 0,
      },
      weekly: {
        ...weeklyTotals,
        avg_daily_ml: weeklyData.length > 0 ? weeklyTotals.total_oil_ml / weeklyData.length : 0,
      },
      monthly: {
        ...monthlyTotals,
        avg_daily_ml: monthlyData.length > 0 ? monthlyTotals.total_oil_ml / monthlyData.length : 0,
      },
      bottles: bottlesSummary,
      health_score: healthScoreResult.data?.score || null,
      oil_type_breakdown: oilTypeBreakdown,
    };

    const latency = Date.now() - startTime;
    console.log(`[tracking-summary] user=${userId} latency=${latency}ms`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[tracking-summary] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
