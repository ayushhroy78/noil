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

      // Calculate health score
      const dailyLimit = 30; // ICMR recommended daily limit in ml
      const weeklyLimit = dailyLimit * 7;

      let score = 100;

      // Deduct for exceeding limits
      if (today > dailyLimit) {
        score -= Math.min(20, ((today - dailyLimit) / dailyLimit) * 20);
      }

      // Deduct for high hidden oil percentage
      const hiddenPercentage = today > 0 ? (todayHidden / today) * 100 : 0;
      if (hiddenPercentage > 30) {
        score -= Math.min(15, ((hiddenPercentage - 30) / 70) * 15);
      }

      // Check oil quality from bottles
      const hasQualityOil = bottles?.some((b) =>
        ["mustard", "groundnut", "cold-pressed"].some((type) =>
          b.oil_type.toLowerCase().includes(type)
        )
      );
      if (hasQualityOil) {
        score += 10;
      }

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
