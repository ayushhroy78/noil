import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { usePoints } from "@/hooks/usePoints";
import { Skeleton } from "@/components/ui/skeleton";

export const PointsDisplay = () => {
  const { userPoints, isLoading } = usePoints();

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Your Points</h3>
          </div>
          <p className="text-3xl font-bold text-primary">
            {userPoints?.total_points || 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total points earned</p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>This week</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {userPoints?.points_this_week || 0}
          </p>
        </div>
      </div>
    </Card>
  );
};
