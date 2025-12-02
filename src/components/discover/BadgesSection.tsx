import { Card } from "@/components/ui/card";
import { Award, Lock } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const BadgesSection = () => {
  const { achievements, userAchievements } = useAchievements();

  if (!achievements) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);

  const tierColors = {
    bronze: "bg-amber-100 text-amber-900 border-amber-300",
    silver: "bg-slate-200 text-slate-900 border-slate-400",
    gold: "bg-yellow-100 text-yellow-900 border-yellow-400",
    platinum: "bg-purple-100 text-purple-900 border-purple-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Achievements</h3>
        <Badge variant="secondary" className="ml-auto">
          {userAchievements?.length || 0} / {achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          
          return (
            <Card
              key={achievement.id}
              className={`p-4 transition-all ${
                isUnlocked
                  ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30"
                  : "bg-muted/30 opacity-60"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${
                    isUnlocked ? tierColors[achievement.badge_tier as keyof typeof tierColors] : "bg-muted border-border"
                  }`}
                >
                  {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {achievement.points_reward} pts
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
