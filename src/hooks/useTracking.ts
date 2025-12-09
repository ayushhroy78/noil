import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface TrackingData {
  consumption: {
    today: number;
    weekly: number;
    monthly: number;
    cookingOil: number;
    bottleOil: number;
    hiddenOil: number;
  };
  healthScore: {
    todayScore: number;
    weeklyAvg: number;
    monthlyAvg: number;
    trend: "up" | "down" | "stable";
  };
  insights: Array<{
    type: "positive" | "warning" | "info";
    message: string;
  }>;
  oilTypeBreakdown?: Record<string, number>;
}

export const useTracking = (userId: string | undefined) => {
  const [data, setData] = useState<TrackingData>({
    consumption: {
      today: 0,
      weekly: 0,
      monthly: 0,
      cookingOil: 0,
      bottleOil: 0,
      hiddenOil: 0,
    },
    healthScore: {
      todayScore: 75,
      weeklyAvg: 72,
      monthlyAvg: 70,
      trend: "up",
    },
    insights: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Use the optimized edge function for aggregated data
      const { data: summary, error } = await supabase.functions.invoke<TrackingSummary>(
        "tracking-summary"
      );

      if (error) {
        console.error("Error fetching tracking summary:", error);
        // Fallback to direct queries if edge function fails
        await fetchDataFallback();
        return;
      }

      if (!summary) {
        setLoading(false);
        return;
      }

      // Calculate health score from the summary
      const dailyLimit = 30;
      const optimalRange = { min: 20, max: 25 };
      const today = summary.today.total_oil_ml;
      
      let score = 40;

      // Quantity scoring
      if (today <= optimalRange.max && today >= optimalRange.min) {
        score += 30;
      } else if (today < optimalRange.min && today > 0) {
        score += 25;
      } else if (today <= 35) {
        score += 20;
      } else if (today <= 50) {
        score += 10;
      } else if (today > 50) {
        score = Math.max(score - 10, 0);
      }

      // Hidden oil penalty
      const hiddenPercentage = today > 0 ? (summary.today.hidden_oil_ml / today) * 100 : 0;
      if (hiddenPercentage < 20) {
        score += 10;
      } else if (hiddenPercentage < 40) {
        score += 5;
      } else if (hiddenPercentage >= 60) {
        score = Math.max(score - 5, 0);
      }

      // Trans fat penalty
      if (summary.today.trans_fat_g > 2) {
        score = Math.max(score - 15, 0);
      } else if (summary.today.trans_fat_g > 1) {
        score = Math.max(score - 10, 0);
      } else if (summary.today.trans_fat_g > 0.5) {
        score = Math.max(score - 5, 0);
      }

      // Consistency check
      const weeklyAvg = summary.weekly.avg_daily_ml;
      if (weeklyAvg > dailyLimit * 1.5) {
        score = Math.max(score - 10, 0);
      } else if (weeklyAvg <= optimalRange.max && weeklyAvg >= optimalRange.min) {
        score = Math.min(score + 5, 100);
      }

      // Use stored health score if available, otherwise use calculated
      const finalScore = summary.health_score ?? Math.max(0, Math.min(100, Math.round(score)));

      // Generate insights
      const insights: Array<{ type: "positive" | "warning" | "info"; message: string }> = [];

      if (today > dailyLimit) {
        insights.push({
          type: "warning",
          message: `You consumed ${Math.round(today - dailyLimit)} ml more than the recommended ${dailyLimit} ml daily limit.`,
        });
      }

      if (hiddenPercentage > 30) {
        insights.push({
          type: "warning",
          message: `${Math.round(hiddenPercentage)}% of today's oil came from packaged foods. Try reducing processed food intake.`,
        });
      }

      if (finalScore >= 80) {
        insights.push({
          type: "positive",
          message: "Excellent! Your oil consumption is within healthy limits.",
        });
      } else if (finalScore < 50) {
        insights.push({
          type: "warning",
          message: "Your oil consumption patterns need improvement.",
        });
      }

      const trend = finalScore >= 75 ? "up" : finalScore < 60 ? "down" : "stable";

      setData({
        consumption: {
          today: Math.round(summary.today.total_oil_ml),
          weekly: Math.round(summary.weekly.total_oil_ml),
          monthly: Math.round(summary.monthly.total_oil_ml),
          cookingOil: Math.round(summary.today.cooking_oil_ml + summary.bottles.avg_daily_from_bottles),
          bottleOil: Math.round(summary.bottles.avg_daily_from_bottles),
          hiddenOil: Math.round(summary.today.hidden_oil_ml),
        },
        healthScore: {
          todayScore: finalScore,
          weeklyAvg: Math.round(finalScore * 0.96),
          monthlyAvg: Math.round(finalScore * 0.93),
          trend,
        },
        insights,
        oilTypeBreakdown: summary.oil_type_breakdown,
      });
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      await fetchDataFallback();
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fallback for when edge function is unavailable
  const fetchDataFallback = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Optimized queries with specific columns and limits
      const [logsResult, scansResult, bottlesResult] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("log_date, amount_ml, source, oil_type")
          .eq("user_id", userId)
          .gte("log_date", monthAgo)
          .order("log_date", { ascending: false })
          .limit(500),
        supabase
          .from("barcode_scans")
          .select("scan_date, oil_content_ml, trans_fat_g")
          .eq("user_id", userId)
          .gte("scan_date", monthAgo)
          .order("scan_date", { ascending: false })
          .limit(200),
        supabase
          .from("bottles")
          .select("quantity_ml, avg_daily_consumption, finish_date, start_date, oil_type")
          .eq("user_id", userId)
          .is("finish_date", null)
          .limit(20),
      ]);

      const logs = logsResult.data || [];
      const scans = scansResult.data || [];
      const bottles = bottlesResult.data || [];

      // Aggregate in memory (still more efficient than multiple queries)
      const todayLogs = logs.filter((l) => l.log_date === today);
      const weeklyLogs = logs.filter((l) => l.log_date >= weekAgo);

      const todayManual = todayLogs.reduce((sum, l) => sum + Number(l.amount_ml), 0);
      const todayHidden = scans
        .filter((s) => s.scan_date?.split("T")[0] === today)
        .reduce((sum, s) => sum + Number(s.oil_content_ml), 0);

      const weeklyTotal = weeklyLogs.reduce((sum, l) => sum + Number(l.amount_ml), 0);
      const monthlyTotal = logs.reduce((sum, l) => sum + Number(l.amount_ml), 0);

      const bottleAvgDaily = bottles.reduce((sum, b) => sum + Number(b.avg_daily_consumption || 0), 0);

      const todayTotal = todayManual + todayHidden + bottleAvgDaily;
      const score = Math.max(0, Math.min(100, 75 - Math.floor(todayTotal / 10)));

      setData({
        consumption: {
          today: Math.round(todayTotal),
          weekly: Math.round(weeklyTotal),
          monthly: Math.round(monthlyTotal),
          cookingOil: Math.round(todayManual + bottleAvgDaily),
          bottleOil: Math.round(bottleAvgDaily),
          hiddenOil: Math.round(todayHidden),
        },
        healthScore: {
          todayScore: score,
          weeklyAvg: Math.round(score * 0.96),
          monthlyAvg: Math.round(score * 0.93),
          trend: score >= 75 ? "up" : "stable",
        },
        insights: [],
      });
    } catch (error) {
      console.error("Fallback tracking fetch failed:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  return { data, loading, refetch: fetchData };
};
