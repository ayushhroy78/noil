import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

interface RegionalRanking {
  rankPercent: number;
  regionLabel: string;
  regionTrend: 'improving' | 'stable' | 'worsening';
  userAvgOil: number;
  regionAvgOil: number;
  totalUsersInRegion: number;
}

export const useRegionalRanking = () => {
  return useQuery({
    queryKey: ["regional-ranking"],
    queryFn: async (): Promise<RegionalRanking | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user's profile with location
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("state, city")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.state) return null;

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const fifteenDaysAgo = format(subDays(new Date(), 15), 'yyyy-MM-dd');

      // Get all users in the same state with their avg consumption
      const { data: stateProfiles } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("state", profile.state);

      if (!stateProfiles || stateProfiles.length < 2) {
        return {
          rankPercent: 50,
          regionLabel: profile.city ? `${profile.city}, ${profile.state}` : profile.state,
          regionTrend: 'stable',
          userAvgOil: 0,
          regionAvgOil: 0,
          totalUsersInRegion: stateProfiles?.length || 1,
        };
      }

      const userIds = stateProfiles.map(p => p.user_id);

      // Get daily logs for all users in the region
      const { data: allLogs } = await supabase
        .from("daily_logs")
        .select("user_id, amount_ml, log_date")
        .in("user_id", userIds)
        .gte("log_date", thirtyDaysAgo);

      if (!allLogs || allLogs.length === 0) {
        return {
          rankPercent: 50,
          regionLabel: profile.city ? `${profile.city}, ${profile.state}` : profile.state,
          regionTrend: 'stable',
          userAvgOil: 0,
          regionAvgOil: 0,
          totalUsersInRegion: userIds.length,
        };
      }

      // Calculate avg consumption per user
      const userConsumption: Record<string, { total: number; days: number }> = {};
      allLogs.forEach(log => {
        if (!userConsumption[log.user_id]) {
          userConsumption[log.user_id] = { total: 0, days: 0 };
        }
        userConsumption[log.user_id].total += Number(log.amount_ml);
        userConsumption[log.user_id].days += 1;
      });

      const userAvgs = Object.entries(userConsumption).map(([uid, data]) => ({
        userId: uid,
        avg: data.days > 0 ? data.total / data.days : 0,
      }));

      // Sort by avg (lower is better)
      userAvgs.sort((a, b) => a.avg - b.avg);

      const currentUserData = userAvgs.find(u => u.userId === user.id);
      const userRankIndex = userAvgs.findIndex(u => u.userId === user.id);
      const rankPercent = userRankIndex >= 0 
        ? Math.round(((userRankIndex + 1) / userAvgs.length) * 100)
        : 50;

      const regionAvgOil = userAvgs.reduce((sum, u) => sum + u.avg, 0) / userAvgs.length;

      // Calculate trend (compare last 15 days to previous 15 days)
      const recentLogs = allLogs.filter(l => l.log_date >= fifteenDaysAgo);
      const olderLogs = allLogs.filter(l => l.log_date < fifteenDaysAgo);
      
      const recentAvg = recentLogs.length > 0 
        ? recentLogs.reduce((sum, l) => sum + Number(l.amount_ml), 0) / recentLogs.length 
        : 0;
      const olderAvg = olderLogs.length > 0 
        ? olderLogs.reduce((sum, l) => sum + Number(l.amount_ml), 0) / olderLogs.length 
        : 0;

      let regionTrend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (olderAvg > 0) {
        const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (changePercent < -5) regionTrend = 'improving';
        else if (changePercent > 5) regionTrend = 'worsening';
      }

      return {
        rankPercent,
        regionLabel: profile.city ? `${profile.city}, ${profile.state}` : profile.state,
        regionTrend,
        userAvgOil: currentUserData?.avg || 0,
        regionAvgOil,
        totalUsersInRegion: userIds.length,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
