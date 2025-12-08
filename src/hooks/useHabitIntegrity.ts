import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateHabitStabilityScore, getRewardGovernance, type HSSResult } from "@/lib/habitStabilityScore";
import { useToast } from "@/hooks/use-toast";

export interface HabitIntegrity {
  id: string;
  user_id: string;
  habit_stability_score: number;
  honesty_level: 'high' | 'medium' | 'low';
  reward_multiplier: number;
  flags: string[];
  feature_vector: Record<string, number>;
  signals: Record<string, unknown>[];
  last_computed_at: string;
  created_at: string;
  updated_at: string;
}

export function useHabitIntegrity(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current habit integrity
  const { data: habitIntegrity, isLoading } = useQuery({
    queryKey: ["habit-integrity", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("habit_integrity")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data as HabitIntegrity | null;
    },
    enabled: !!userId,
  });

  // Compute HSS locally (for immediate feedback)
  const computeLocalHSS = async (): Promise<HSSResult | null> => {
    if (!userId) return null;

    try {
      // Fetch last 30 days of logs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [logsResult, scansResult, profileResult] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("log_date, amount_ml")
          .eq("user_id", userId)
          .gte("log_date", thirtyDaysAgo.toISOString().split('T')[0])
          .order("log_date", { ascending: true }),
        supabase
          .from("barcode_scans")
          .select("scan_date, oil_content_ml, product_name")
          .eq("user_id", userId)
          .gte("scan_date", thirtyDaysAgo.toISOString()),
        supabase
          .from("user_profiles")
          .select("household_size")
          .eq("user_id", userId)
          .maybeSingle()
      ]);

      if (logsResult.error) throw logsResult.error;
      if (scansResult.error) throw scansResult.error;

      const dailyLogs = (logsResult.data || []).map(log => ({
        date: log.log_date,
        total_oil_ml: Number(log.amount_ml)
      }));

      const barcodeScans = (scansResult.data || []).map(scan => ({
        scan_date: scan.scan_date,
        oil_content_ml: Number(scan.oil_content_ml),
        product_name: scan.product_name
      }));

      const householdSize = profileResult.data?.household_size || 1;

      return calculateHabitStabilityScore({
        dailyLogs,
        barcodeScans,
        householdSize,
        windowDays: 30
      });
    } catch (error) {
      console.error("Error computing local HSS:", error);
      return null;
    }
  };

  // Compute and store HSS
  const computeHSSMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user ID");

      const hssResult = await computeLocalHSS();
      if (!hssResult) throw new Error("Failed to compute HSS");

      // Check if record exists
      const { data: existing } = await supabase
        .from("habit_integrity")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const payload = {
        user_id: userId,
        habit_stability_score: hssResult.score,
        honesty_level: hssResult.honestyLevel,
        reward_multiplier: hssResult.rewardMultiplier,
        flags: JSON.parse(JSON.stringify(hssResult.flags)),
        feature_vector: JSON.parse(JSON.stringify(hssResult.featureVector)),
        signals: JSON.parse(JSON.stringify(hssResult.signals)),
        last_computed_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from("habit_integrity")
          .update(payload)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_integrity")
          .insert([payload]);
        if (error) throw error;
      }

      return hssResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-integrity", userId] });
    },
    onError: (error) => {
      console.error("Error computing HSS:", error);
      toast({
        title: "Error",
        description: "Failed to update habit integrity score",
        variant: "destructive"
      });
    }
  });

  // Get reward multiplier with fallback
  const getRewardMultiplier = (): number => {
    if (!habitIntegrity) return 1.0; // Neutral fallback
    return habitIntegrity.reward_multiplier;
  };

  // Get governance rules
  const getGovernance = () => {
    if (!habitIntegrity) {
      return {
        multiplier: 1.0,
        maxDailyPoints: 100,
        maxWeeklyPoints: 500,
        nudgeMessage: undefined,
        boostMessage: undefined
      };
    }

    return getRewardGovernance({
      score: habitIntegrity.habit_stability_score,
      honestyLevel: habitIntegrity.honesty_level as 'high' | 'medium' | 'low',
      rewardMultiplier: habitIntegrity.reward_multiplier,
      featureVector: habitIntegrity.feature_vector as any,
      signals: habitIntegrity.signals as any,
      flags: habitIntegrity.flags
    });
  };

  // Check if HSS needs recomputation (older than 24 hours)
  const needsRecomputation = (): boolean => {
    if (!habitIntegrity) return true;
    
    const lastComputed = new Date(habitIntegrity.last_computed_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastComputed.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 24;
  };

  return {
    habitIntegrity,
    isLoading,
    computeHSS: computeHSSMutation.mutate,
    isComputing: computeHSSMutation.isPending,
    getRewardMultiplier,
    getGovernance,
    needsRecomputation,
    computeLocalHSS
  };
}
