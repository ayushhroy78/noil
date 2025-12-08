import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, startOfDay, differenceInDays } from "date-fns";

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

  const fetchData = async () => {
    if (!userId) return;

    try {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const monthStart = startOfMonth(now);
      const todayStart = startOfDay(now);

      // Fetch daily logs
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", monthStart.toISOString());

      // Fetch barcode scans
      const { data: scans } = await supabase
        .from("barcode_scans")
        .select("*")
        .eq("user_id", userId)
        .gte("scan_date", monthStart.toISOString());

      // Fetch bottles (all bottles, not just from this month)
      const { data: bottles } = await supabase
        .from("bottles")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });

      // Calculate consumption
      const todayLogs = logs?.filter(
        (log) => new Date(log.log_date) >= todayStart
      ) || [];
      const weeklyLogs = logs?.filter(
        (log) => new Date(log.log_date) >= weekStart
      ) || [];
      const todayScans = scans?.filter(
        (scan) => new Date(scan.scan_date) >= todayStart
      ) || [];
      const weeklyScans = scans?.filter(
        (scan) => new Date(scan.scan_date) >= weekStart
      ) || [];

      const todayManual = todayLogs
        .filter((log) => log.source === "manual")
        .reduce((sum, log) => sum + Number(log.amount_ml), 0);
      const todayHidden = todayScans.reduce(
        (sum, scan) => sum + Number(scan.oil_content_ml), 0
      );

      const weeklyManual = weeklyLogs
        .filter((log) => log.source === "manual")
        .reduce((sum, log) => sum + Number(log.amount_ml), 0);
      const monthlyManual = logs
        ?.filter((log) => log.source === "manual")
        .reduce((sum, log) => sum + Number(log.amount_ml), 0) || 0;

      const weeklyHidden = weeklyScans.reduce(
        (sum, scan) => sum + Number(scan.oil_content_ml), 0
      );
      const monthlyHidden = scans?.reduce(
        (sum, scan) => sum + Number(scan.oil_content_ml), 0
      ) || 0;

      // Calculate bottle consumption - ONLY from finished bottles
      let bottleAvgDaily = 0;
      let weeklyBottleTotal = 0;
      let monthlyBottleTotal = 0;

      const finishedBottles = bottles?.filter((b) => b.finish_date) || [];

      finishedBottles.forEach((bottle) => {
        const startDate = new Date(bottle.start_date);
        const finishDate = new Date(bottle.finish_date!);
        const avgDaily = Number(bottle.avg_daily_consumption) || 0;
        
        // Add to average daily if this bottle overlaps with today
        if (startDate <= now && finishDate >= todayStart) {
          bottleAvgDaily += avgDaily;
        }
        
        // Add to weekly total if finished this week
        if (finishDate >= weekStart) {
          weeklyBottleTotal += Number(bottle.quantity_ml);
        }
        
        // Add to monthly total if finished this month
        if (finishDate >= monthStart) {
          monthlyBottleTotal += Number(bottle.quantity_ml);
        }
      });

      const today = todayManual + todayHidden + bottleAvgDaily;
      const weekly = weeklyManual + weeklyHidden + weeklyBottleTotal;
      const monthly = monthlyManual + monthlyHidden + monthlyBottleTotal;

      // Calculate health score with realistic, nuanced approach
      const dailyLimit = 30; // ICMR recommended daily limit in ml
      const optimalRange = { min: 20, max: 25 }; // Optimal daily consumption
      
      let score = 40; // Base score - everyone starts here

      // 1. QUANTITY SCORE (30 points max) - Based on daily consumption
      if (today <= optimalRange.max && today >= optimalRange.min) {
        score += 30; // Perfect range
      } else if (today < optimalRange.min && today > 0) {
        score += 25; // A bit low, but acceptable
      } else if (today <= 35) {
        score += 20; // Slightly above optimal
      } else if (today <= 50) {
        score += 10; // High consumption
      } else if (today > 50) {
        score = Math.max(score - 10, 0); // Excessive - penalty
      }

      // 2. OIL QUALITY SCORE (20 points max) - Based on oil types used
      const qualityOils = bottles?.filter((b) =>
        ["mustard", "groundnut", "cold-pressed", "olive", "coconut"].some((type) =>
          b.oil_type.toLowerCase().includes(type)
        )
      ) || [];
      
      const refinedOils = bottles?.filter((b) =>
        ["refined", "palm", "vegetable"].some((type) =>
          b.oil_type.toLowerCase().includes(type)
        )
      ) || [];

      if (qualityOils.length > 0 && refinedOils.length === 0) {
        score += 20; // All quality oils
      } else if (qualityOils.length > refinedOils.length) {
        score += 15; // Mostly quality oils
      } else if (qualityOils.length > 0) {
        score += 10; // Mix of quality and refined
      } else if (refinedOils.length > 0) {
        score += 5; // Only refined oils
      }

      // 3. TRANS FAT PENALTY (up to -15 points)
      const todayTransFat = todayScans.reduce(
        (sum, scan) => sum + Number(scan.trans_fat_g || 0), 0
      );
      
      if (todayTransFat > 2) {
        score = Math.max(score - 15, 0); // High trans fat is very bad
      } else if (todayTransFat > 1) {
        score = Math.max(score - 10, 0); // Moderate trans fat
      } else if (todayTransFat > 0.5) {
        score = Math.max(score - 5, 0); // Some trans fat
      }

      // 4. SOURCE BALANCE SCORE (10 points max or -5 penalty)
      const hiddenPercentage = today > 0 ? (todayHidden / today) * 100 : 0;
      
      if (hiddenPercentage < 20) {
        score += 10; // Minimal packaged food
      } else if (hiddenPercentage < 40) {
        score += 5; // Moderate packaged food
      } else if (hiddenPercentage >= 60) {
        score = Math.max(score - 5, 0); // Heavy reliance on packaged foods
      }

      // 5. CONSISTENCY BONUS/PENALTY (5 points or -10 points)
      const weeklyAvg = weekly > 0 ? weekly / 7 : 0;
      if (weeklyAvg > dailyLimit * 1.5) {
        score = Math.max(score - 10, 0); // Consistently high consumption
      } else if (weeklyAvg <= optimalRange.max && weeklyAvg >= optimalRange.min) {
        score = Math.min(score + 5, 100); // Consistently good
      }

      // Final score clamped between 0-100
      score = Math.max(0, Math.min(100, Math.round(score)));

      // Generate insights
      const insights: Array<{
        type: "positive" | "warning" | "info";
        message: string;
      }> = [];

      if (today > dailyLimit) {
        insights.push({
          type: "warning",
          message: `You consumed ${Math.round(
            today - dailyLimit
          )} ml more than the recommended ${dailyLimit} ml daily limit.`,
        });
      }

      if (hiddenPercentage > 30) {
        insights.push({
          type: "warning",
          message: `${Math.round(
            hiddenPercentage
          )}% of today's oil came from packaged foods. Try reducing processed food intake.`,
        });
      }

      if (finishedBottles.length > 0) {
        const lastBottle = finishedBottles[finishedBottles.length - 1];
        const avgDaily = Number(lastBottle.avg_daily_consumption) || 0;
        
        if (avgDaily > dailyLimit) {
          insights.push({
            type: "info",
            message: `Your last bottle averaged ${Math.round(
              avgDaily
            )} ml/day. Consider reducing usage for better health.`,
          });
        } else if (avgDaily <= optimalRange.max) {
          insights.push({
            type: "positive",
            message: `Great job! Your last bottle usage was ${Math.round(avgDaily)} ml/day - within optimal range.`,
          });
        }
      }

      if (score >= 80) {
        insights.push({
          type: "positive",
          message: "Excellent! Your oil consumption is within healthy limits.",
        });
      } else if (score < 50) {
        insights.push({
          type: "warning",
          message: "Your oil consumption patterns need improvement. Check the recommendations above.",
        });
      }

      // Calculate trend (simplified)
      const trend = score >= 75 ? "up" : score < 60 ? "down" : "stable";

      setData({
        consumption: {
          today: Math.round(today),
          weekly: Math.round(weekly),
          monthly: Math.round(monthly),
          cookingOil: Math.round(todayManual + bottleAvgDaily),
          bottleOil: 0,
          hiddenOil: Math.round(todayHidden),
        },
        healthScore: {
          todayScore: score,
          weeklyAvg: Math.round(score * 0.96),
          monthlyAvg: Math.round(score * 0.93),
          trend,
        },
        insights,
      });
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  return { data, loading, refetch: fetchData };
};
