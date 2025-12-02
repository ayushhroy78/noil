import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Share2 } from "lucide-react";
import { SocialShare } from "@/components/discover/SocialShare";
import { Button } from "@/components/ui/button";

interface HealthScoreData {
  todayScore: number;
  weeklyAvg: number;
  monthlyAvg: number;
  trend: "up" | "down" | "stable";
}

interface HealthScoreCardProps {
  data: HealthScoreData;
}

export const HealthScoreCard = ({ data }: HealthScoreCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Healthy";
    if (score >= 50) return "Needs Improvement";
    return "High Risk";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/20";
    if (score >= 50) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const getTrendDescription = () => {
    if (data.trend === "up") return "I'm improving my health with better oil consumption habits!";
    if (data.trend === "down") return "Working on improving my oil consumption habits.";
    return "Maintaining consistent healthy oil consumption.";
  };

  return (
    <Card className={`border-2 ${getScoreBgColor(data.todayScore)} shadow-medium`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Health Score
          </CardTitle>
          <SocialShare
            type="health_score"
            title="My Health Score"
            description={getTrendDescription()}
            score={data.todayScore}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className={`text-6xl font-bold ${getScoreColor(data.todayScore)}`}>
            {data.todayScore}
          </div>
          <Badge
            variant={data.todayScore >= 80 ? "default" : data.todayScore >= 50 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {getScoreLabel(data.todayScore)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
          <div className="text-center p-3 rounded-lg bg-card/50">
            <p className="text-xs text-muted-foreground mb-1">Weekly Avg</p>
            <p className={`text-xl font-semibold ${getScoreColor(data.weeklyAvg)}`}>
              {data.weeklyAvg}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card/50">
            <p className="text-xs text-muted-foreground mb-1">Monthly Avg</p>
            <p className={`text-xl font-semibold ${getScoreColor(data.monthlyAvg)}`}>
              {data.monthlyAvg}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          {data.trend === "up" && (
            <>
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">Improving</span>
            </>
          )}
          {data.trend === "down" && (
            <>
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">Declining</span>
            </>
          )}
          {data.trend === "stable" && (
            <span className="text-sm text-muted-foreground font-medium">Stable</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
