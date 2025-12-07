import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Target, Trophy, Zap } from "lucide-react";
import { usePoints } from "@/hooks/usePoints";
import { usePointTransactions } from "@/hooks/usePointTransactions";
import { cn } from "@/lib/utils";

// Reward tiers configuration
const REWARD_TIERS = [
  { name: "Bronze", minPoints: 0, maxPoints: 299, color: "text-orange-600", bgColor: "bg-orange-100" },
  { name: "Silver", minPoints: 300, maxPoints: 749, color: "text-slate-500", bgColor: "bg-slate-100" },
  { name: "Gold", minPoints: 750, maxPoints: 1499, color: "text-amber-500", bgColor: "bg-amber-100" },
  { name: "Platinum", minPoints: 1500, maxPoints: 2999, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  { name: "Diamond", minPoints: 3000, maxPoints: Infinity, color: "text-purple-600", bgColor: "bg-purple-100" },
];

export const PointsDashboard = () => {
  const { userPoints, isLoading: pointsLoading } = usePoints();
  const { totalEarned, totalSpent, earnedBreakdown, isLoading: transactionsLoading } = usePointTransactions();

  const currentPoints = userPoints?.total_points || 0;
  
  // Find current tier and next tier
  const currentTier = REWARD_TIERS.find(t => currentPoints >= t.minPoints && currentPoints <= t.maxPoints) || REWARD_TIERS[0];
  const currentTierIndex = REWARD_TIERS.indexOf(currentTier);
  const nextTier = REWARD_TIERS[currentTierIndex + 1];
  
  // Calculate progress to next tier
  const pointsInCurrentTier = currentPoints - currentTier.minPoints;
  const tierRange = (nextTier?.minPoints || currentTier.maxPoints) - currentTier.minPoints;
  const tierProgress = nextTier ? Math.min((pointsInCurrentTier / tierRange) * 100, 100) : 100;
  const pointsToNextTier = nextTier ? nextTier.minPoints - currentPoints : 0;

  // Source label mapping
  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      challenge: "Challenges",
      quiz: "Quizzes",
      referral: "Referrals",
      streak: "Daily Streaks",
      achievement: "Achievements",
      daily_login: "Daily Login",
      milestone: "Milestones",
    };
    return labels[source] || source;
  };

  // Source icon mapping
  const getSourceIcon = (source: string) => {
    const icons: Record<string, React.ReactNode> = {
      challenge: <Trophy className="w-4 h-4" />,
      quiz: <Target className="w-4 h-4" />,
      streak: <Zap className="w-4 h-4" />,
    };
    return icons[source] || <Sparkles className="w-4 h-4" />;
  };

  if (pointsLoading || transactionsLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="h-32" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Points Display */}
      <Card className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
        <CardContent className="pt-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Points</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary animate-fade-in">
                  {currentPoints.toLocaleString()}
                </span>
                <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
            </div>
            <Badge className={cn("px-3 py-1.5 text-sm font-semibold", currentTier.bgColor, currentTier.color)}>
              {currentTier.name}
            </Badge>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                <span className="font-medium text-primary">{pointsToNextTier} pts to go</span>
              </div>
              <Progress value={tierProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lifetime Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              +{totalEarned.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span className="text-xs text-rose-700 dark:text-rose-400">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              -{totalSpent.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="text-center text-sm text-muted-foreground">
            You've earned <span className="font-semibold text-emerald-600">+{totalEarned.toLocaleString()}</span> points, 
            spent <span className="font-semibold text-rose-600">-{totalSpent.toLocaleString()}</span> points, 
            <span className="font-bold text-primary"> {currentPoints.toLocaleString()}</span> points remaining
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      {earnedBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Points Earned By Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {earnedBreakdown
              .sort((a, b) => b.total - a.total)
              .map((breakdown, index) => (
                <div key={breakdown.source} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getSourceIcon(breakdown.source)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{getSourceLabel(breakdown.source)}</span>
                      <span className="text-sm font-bold text-emerald-600">+{breakdown.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{breakdown.count} {breakdown.count === 1 ? 'time' : 'times'}</span>
                      <Progress 
                        value={(breakdown.total / totalEarned) * 100} 
                        className="w-20 h-1.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Tier Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Reward Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {REWARD_TIERS.slice(0, -1).map((tier, index) => {
              const isCurrentTier = tier.name === currentTier.name;
              const isCompleted = currentPoints > tier.maxPoints;
              const nextT = REWARD_TIERS[index + 1];
              
              return (
                <div 
                  key={tier.name} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-all",
                    isCurrentTier && "bg-primary/10 ring-1 ring-primary/30",
                    isCompleted && "opacity-60"
                  )}
                >
                  <Badge 
                    className={cn(
                      "w-16 justify-center",
                      tier.bgColor, 
                      tier.color,
                      isCompleted && "opacity-70"
                    )}
                  >
                    {tier.name}
                  </Badge>
                  <div className="flex-1">
                    <Progress 
                      value={isCompleted ? 100 : isCurrentTier ? tierProgress : 0} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {nextT?.minPoints.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
