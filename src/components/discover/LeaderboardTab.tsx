import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface LeaderboardEntry {
  rank: number;
  display_name: string;
  total_points: number;
  points_this_week: number;
  points_this_month: number;
}

export const LeaderboardTab = () => {
  const { t } = useTranslation();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Use anonymized leaderboard function
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["anonymized-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_anonymized_leaderboard");
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });

  // Get current user's rank
  const { data: userRank } = useQuery({
    queryKey: ["user-rank", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data, error } = await supabase
        .from("user_points")
        .select("total_points, points_this_week")
        .eq("user_id", currentUserId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentUserId,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const LeaderboardList = ({ data, pointsKey }: { data: LeaderboardEntry[], pointsKey: "total_points" | "points_this_week" }) => (
    <div className="space-y-2">
      {data.map((entry) => (
        <Card key={entry.rank} className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{entry.display_name}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {entry[pointsKey]}
              </p>
              <p className="text-xs text-muted-foreground">{t('common.points')}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">{t('discover.leaderboardTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('discover.leaderboardSubtitle')}</p>
      </div>

      {/* Current User Stats */}
      {userRank && (
        <Card className="p-4 bg-primary/10 border-primary/30 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t('discover.yourStats')}</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{userRank.total_points}</p>
              <p className="text-xs text-muted-foreground">{t('discover.totalPoints')}</p>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="all-time" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-time">{t('discover.allTime')}</TabsTrigger>
          <TabsTrigger value="weekly">{t('discover.thisWeek')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-time" className="mt-4">
          {leaderboard && leaderboard.length > 0 ? (
            <LeaderboardList data={leaderboard} pointsKey="total_points" />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">{t('discover.noLeaderboardData')}</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-4">
          {leaderboard && leaderboard.length > 0 ? (
            <LeaderboardList 
              data={[...leaderboard].sort((a, b) => b.points_this_week - a.points_this_week)} 
              pointsKey="points_this_week" 
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">{t('discover.noWeeklyData')}</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};