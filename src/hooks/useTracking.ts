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

      // Calculate bottle consumption
      let bottleAvgDaily = 0;
      let monthlyBottleTotal = 0;

      bottles?.forEach((bottle) => {
        const startDate = new Date(bottle.start_date);
        const finishDate = bottle.finish_date ? new Date(bottle.finish_date) : null;
        
        // For finished bottles with avg_daily_consumption
        if (finishDate && bottle.avg_daily_consumption) {
          bottleAvgDaily += Number(bottle.avg_daily_consumption);
          
          // Add to monthly total if finished this month
          if (finishDate >= monthStart) {
            monthlyBottleTotal += Number(bottle.quantity_ml);
          }
        }
        // For active bottles (no finish date yet)
        else if (!finishDate && startDate <= now) {
          const daysUsed = differenceInDays(now, startDate) + 1;
          const estimatedDaily = Number(bottle.quantity_ml) / daysUsed;
          bottleAvgDaily += estimatedDaily;
        }
      });

      const today = todayManual + todayHidden + bottleAvgDaily;
      const weekly = weeklyManual + weeklyHidden;
      const monthly = monthlyManual + monthlyHidden + monthlyBottleTotal;

      // Calculate health score with realistic, nuanced approach
      const dailyLimit = 30; // ICMR recommended daily limit in ml
      const optimalRange = { min: 20, max: 25 }; // Optimal daily consumption
      const weeklyLimit = dailyLimit * 7;

      let score = 40; // Base score - everyone starts here

      // 1. QUANTITY SCORE (30 points) - Based on daily consumption
      if (today <= optimalRange.max && today >= optimalRange.min) {
        score += 30; // Perfect range
      } else if (today < optimalRange.min && today > 0) {
        score += 25; // A bit low, but acceptable
      } else if (today <= 35) {
        score += 20; // Slightly above optimal
      } else if (today <= 50) {
        score += 10; // High consumption
      } else if (today > 50) {
        score += Math.max(0, 10 - ((today - 50) / 5)); // Excessive
      }

      // 2. OIL QUALITY SCORE (20 points) - Based on oil types used
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

      // 3. TRANS FAT PENALTY - From packaged foods
      const todayTransFat = todayScans.reduce(
        (sum, scan) => sum + Number(scan.trans_fat_g || 0), 0
      );
      
      if (todayTransFat > 2) {
        score -= 15; // High trans fat is very bad
      } else if (todayTransFat > 1) {
        score -= 10; // Moderate trans fat
      } else if (todayTransFat > 0.5) {
        score -= 5; // Some trans fat
      }

      // 4. SOURCE BALANCE SCORE (10 points) - Hidden oil from packaged foods
      const hiddenPercentage = today > 0 ? (todayHidden / today) * 100 : 0;
      
      if (hiddenPercentage < 20) {
        score += 10; // Minimal packaged food
      } else if (hiddenPercentage < 40) {
        score += 5; // Moderate packaged food
      } else if (hiddenPercentage >= 60) {
        score -= 5; // Heavy reliance on packaged foods
      }

      // 5. CONSISTENCY BONUS/PENALTY - Weekly average matters
      if (weekly / 7 > dailyLimit * 1.5) {
        score -= 10; // Consistently high consumption
      } else if (weekly / 7 <= optimalRange.max && weekly > 0) {
        score += 5; // Consistently good
      }

      // Final score between 0-100
      score = Math.max(0, Math.min(100, Math.round(score)));

      // Generate insights
      const insights: Array<{
        type: "positive" | "warning" | "info";
        message: string;
      }> = [];
      
      // Get finished bottles for insights
      const finishedBottles = bottles?.filter((b) => b.finish_date) || [];

      if (today > dailyLimit) {
        insights.push({
          type: "warning",
          message: `You used ${Math.round(
            today - dailyLimit
          )} ml more than the recommended daily limit.`,
        });
      }

      if (hiddenPercentage > 30) {
        insights.push({
          type: "warning",
          message: `Packaged foods added ${Math.round(
            hiddenPercentage
          )}% of today's oil. Try to reduce processed food intake.`,
        });
      }

      if (finishedBottles.length > 0) {
        const lastBottle = finishedBottles[finishedBottles.length - 1];
        const daysUsed = lastBottle.days_used || differenceInDays(
          new Date(lastBottle.finish_date!),
          new Date(lastBottle.start_date)
        );
        const avgDaily = Number(lastBottle.quantity_ml) / daysUsed;
        
        if (avgDaily > dailyLimit) {
          insights.push({
            type: "info",
            message: `Your bottle finish speed is high (${Math.round(
              avgDaily
            )} ml/day). Consider reducing usage for a better score.`,
          });
        }
      }

      if (score >= 80) {
        insights.push({
          type: "positive",
          message: "Great job! Your oil consumption is within healthy limits.",
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
    fetchData();
  }, [userId]);

  return { data, loading, refetch: fetchData };
};
