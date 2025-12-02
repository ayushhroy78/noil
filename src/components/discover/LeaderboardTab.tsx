import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

export const LeaderboardTab = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const { data: weeklyLeaderboard } = useQuery({
    queryKey: ["weekly-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .order("points_this_week", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const LeaderboardList = ({ data, pointsKey }: { data: any[], pointsKey: string }) => (
    <div className="space-y-2">
      {data.map((entry, index) => {
        const isCurrentUser = entry.user_id === user?.id;
        return (
          <Card
            key={entry.id}
            className={`p-4 ${
              isCurrentUser
                ? "bg-primary/10 border-primary/30"
                : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {isCurrentUser ? "You" : `User ${entry.user_id.slice(0, 8)}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  {entry[pointsKey]}
                </p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </Card>
        );
      })}
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
        <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">Compete with others and climb the ranks!</p>
      </div>

      <Tabs defaultValue="all-time" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-time" className="mt-4">
          {leaderboard && leaderboard.length > 0 ? (
            <LeaderboardList data={leaderboard} pointsKey="total_points" />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No leaderboard data yet. Be the first!</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-4">
          {weeklyLeaderboard && weeklyLeaderboard.length > 0 ? (
            <LeaderboardList data={weeklyLeaderboard} pointsKey="points_this_week" />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No weekly data yet. Start earning points!</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
