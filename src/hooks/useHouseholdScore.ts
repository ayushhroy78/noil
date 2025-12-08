import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import { getHouseholdGrade, type HouseholdGrade } from "@/lib/milestoneConfig";

interface HouseholdScore {
  grade: HouseholdGrade;
  gradeLabel: string;
  avgOilPerPerson: number;
  householdSize: number;
  totalOilThisMonth: number;
  improvementPercent: number;
  trend: 'up' | 'down' | 'stable';
}

export const useHouseholdScore = () => {
  return useQuery({
    queryKey: ["household-score"],
    queryFn: async (): Promise<HouseholdScore | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get household size
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("household_size")
        .eq("user_id", user.id)
        .maybeSingle();

      const householdSize = profile?.household_size || 1;

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd');

      // Get current month's logs
      const { data: currentLogs } = await supabase
        .from("daily_logs")
        .select("amount_ml, log_date")
        .eq("user_id", user.id)
        .gte("log_date", thirtyDaysAgo);

      // Get previous month's logs for comparison
      const { data: previousLogs } = await supabase
        .from("daily_logs")
        .select("amount_ml, log_date")
        .eq("user_id", user.id)
        .gte("log_date", sixtyDaysAgo)
        .lt("log_date", thirtyDaysAgo);

      const currentTotal = currentLogs?.reduce((sum, l) => sum + Number(l.amount_ml), 0) || 0;
      const previousTotal = previousLogs?.reduce((sum, l) => sum + Number(l.amount_ml), 0) || 0;

      const daysWithLogs = currentLogs?.length || 1;
      const avgDailyTotal = currentTotal / daysWithLogs;
      const avgOilPerPerson = avgDailyTotal / householdSize;

      const grade = getHouseholdGrade(avgOilPerPerson);

      let improvementPercent = 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (previousTotal > 0) {
        improvementPercent = Math.round(((previousTotal - currentTotal) / previousTotal) * 100);
        if (improvementPercent > 5) trend = 'down'; // Oil going down = good
        else if (improvementPercent < -5) trend = 'up'; // Oil going up = bad
      }

      const gradeLabels: Record<HouseholdGrade, string> = {
        'A+': 'Excellent',
        'A': 'Very Good',
        'B': 'Good',
        'C': 'Needs Improvement',
        'D': 'Needs Attention',
      };

      return {
        grade,
        gradeLabel: gradeLabels[grade],
        avgOilPerPerson: Math.round(avgOilPerPerson * 10) / 10,
        householdSize,
        totalOilThisMonth: Math.round(currentTotal),
        improvementPercent: Math.abs(improvementPercent),
        trend,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
