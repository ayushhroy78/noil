import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TrendingDown, TrendingUp, Minus, 
  Shield, Utensils, Droplet, Calendar, Star,
  ChevronRight, Award
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, subWeeks } from "date-fns";
import { CheckIn } from "@/hooks/useChallengeTracking";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

interface ChallengeWeeklySummaryProps {
  checkIns: CheckIn[];
  challengeStartDate: string;
  currentWeek?: number;
}

interface WeeklySummary {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  mealsLogged: number;
  totalOilMl: number;
  avgOilPerMeal: number;
  avgVerificationScore: number;
  photosUploaded: number;
  cookingMethods: Record<string, number>;
  oilTypes: Record<string, number>;
  moodDistribution: Record<string, number>;
  avgEnergyLevel: number;
  dailyBreakdown: { day: string; meals: number; oil: number }[];
}

export const ChallengeWeeklySummary = ({
  checkIns,
  challengeStartDate,
  currentWeek = 1,
}: ChallengeWeeklySummaryProps) => {
  const weeklySummaries = useMemo(() => {
    const summaries: WeeklySummary[] = [];
    const startDate = parseISO(challengeStartDate);
    
    // Generate summaries for each completed week
    for (let week = 0; week < currentWeek; week++) {
      const weekStart = startOfWeek(subWeeks(new Date(), currentWeek - week - 1), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Use challenge start date for week 1
      const actualWeekStart = week === 0 ? startDate : weekStart;
      
      const weekCheckIns = checkIns.filter(checkIn => {
        const checkInDate = parseISO(checkIn.check_in_date);
        return isWithinInterval(checkInDate, { start: actualWeekStart, end: weekEnd });
      });

      if (weekCheckIns.length === 0 && week < currentWeek - 1) continue;

      // Calculate statistics
      const totalOil = weekCheckIns.reduce((sum, c) => sum + (c.oil_quantity_ml || 0), 0);
      const verificationScores = weekCheckIns.filter(c => c.verification_score).map(c => c.verification_score);
      const avgVerification = verificationScores.length > 0 
        ? verificationScores.reduce((a, b) => a + b, 0) / verificationScores.length 
        : 0;
      
      const photosUploaded = weekCheckIns.filter(c => c.photo_url).length;
      
      const cookingMethods: Record<string, number> = {};
      const oilTypes: Record<string, number> = {};
      const moodDistribution: Record<string, number> = {};
      let totalEnergy = 0;
      let energyCount = 0;

      weekCheckIns.forEach(c => {
        if (c.cooking_method) {
          cookingMethods[c.cooking_method] = (cookingMethods[c.cooking_method] || 0) + 1;
        }
        if (c.oil_type) {
          oilTypes[c.oil_type] = (oilTypes[c.oil_type] || 0) + 1;
        }
        if (c.mood) {
          moodDistribution[c.mood] = (moodDistribution[c.mood] || 0) + 1;
        }
        if (c.energy_level) {
          totalEnergy += c.energy_level;
          energyCount++;
        }
      });

      // Daily breakdown
      const dailyBreakdown: { day: string; meals: number; oil: number }[] = [];
      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      
      for (let d = 0; d < 7; d++) {
        const dayCheckIns = weekCheckIns.filter(c => {
          const checkInDate = parseISO(c.check_in_date);
          return checkInDate.getDay() === (d + 1) % 7;
        });
        
        dailyBreakdown.push({
          day: daysOfWeek[d],
          meals: dayCheckIns.length,
          oil: dayCheckIns.reduce((sum, c) => sum + (c.oil_quantity_ml || 0), 0),
        });
      }

      summaries.push({
        weekNumber: week + 1,
        weekStart: actualWeekStart,
        weekEnd,
        mealsLogged: weekCheckIns.length,
        totalOilMl: totalOil,
        avgOilPerMeal: weekCheckIns.length > 0 ? totalOil / weekCheckIns.length : 0,
        avgVerificationScore: avgVerification,
        photosUploaded,
        cookingMethods,
        oilTypes,
        moodDistribution,
        avgEnergyLevel: energyCount > 0 ? totalEnergy / energyCount : 0,
        dailyBreakdown,
      });
    }

    return summaries;
  }, [checkIns, challengeStartDate, currentWeek]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/20";
    if (score >= 60) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const getTrend = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 5) return { icon: Minus, color: "text-muted-foreground", text: "Stable" };
    if (change > 0) return { icon: TrendingUp, color: "text-destructive", text: `+${change.toFixed(0)}%` };
    return { icon: TrendingDown, color: "text-success", text: `${change.toFixed(0)}%` };
  };

  const getMostUsed = (record: Record<string, number>) => {
    const entries = Object.entries(record);
    if (entries.length === 0) return "N/A";
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  if (weeklySummaries.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Complete your first week to see summary reports!
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestWeek = weeklySummaries[weeklySummaries.length - 1];
  const previousWeek = weeklySummaries.length > 1 ? weeklySummaries[weeklySummaries.length - 2] : null;
  const oilTrend = previousWeek ? getTrend(latestWeek.totalOilMl, previousWeek.totalOilMl) : null;

  const chartConfig = {
    meals: { label: "Meals", color: "hsl(var(--primary))" },
    oil: { label: "Oil (ml)", color: "hsl(var(--warning))" },
  };

  return (
    <div className="space-y-4">
      {/* Current Week Summary Header */}
      <Card className="shadow-soft bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Week {latestWeek.weekNumber} Summary
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {format(latestWeek.weekStart, "MMM d")} - {format(latestWeek.weekEnd, "MMM d")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Meals Logged */}
            <div className="text-center p-3 bg-card rounded-lg border">
              <Utensils className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{latestWeek.mealsLogged}</p>
              <p className="text-xs text-muted-foreground">Meals Logged</p>
            </div>

            {/* Total Oil */}
            <div className="text-center p-3 bg-card rounded-lg border">
              <Droplet className="w-5 h-5 mx-auto mb-1 text-warning" />
              <p className="text-2xl font-bold">{latestWeek.totalOilMl.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">ml Oil Used</p>
              {oilTrend && (
                <div className={`flex items-center justify-center gap-1 mt-1 ${oilTrend.color}`}>
                  <oilTrend.icon className="w-3 h-3" />
                  <span className="text-xs">{oilTrend.text}</span>
                </div>
              )}
            </div>

            {/* Verification Score */}
            <div className={`text-center p-3 rounded-lg border ${getScoreBg(latestWeek.avgVerificationScore)}`}>
              <Shield className="w-5 h-5 mx-auto mb-1" />
              <p className={`text-2xl font-bold ${getScoreColor(latestWeek.avgVerificationScore)}`}>
                {latestWeek.avgVerificationScore.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Verification</p>
            </div>
          </div>

          {/* Verification Score Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Authenticity Score</span>
              <span className="font-medium">{latestWeek.avgVerificationScore.toFixed(0)}/100</span>
            </div>
            <Progress 
              value={latestWeek.avgVerificationScore} 
              className="h-2"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="w-3 h-3 text-warning" />
              <span>{latestWeek.photosUploaded} photos uploaded this week</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown Chart */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Daily Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latestWeek.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="meals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Meals" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Oil Consumption Trend */}
      {weeklySummaries.length > 1 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Oil Consumption Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySummaries.map(w => ({
                  week: `Week ${w.weekNumber}`,
                  oil: w.totalOilMl,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="oil" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--warning))" }}
                    name="Oil (ml)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights & Patterns */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4" />
            Week {latestWeek.weekNumber} Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Most Used Oil */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Most Used Oil</span>
            <Badge variant="secondary">{getMostUsed(latestWeek.oilTypes)}</Badge>
          </div>

          {/* Preferred Cooking Method */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Top Cooking Method</span>
            <Badge variant="secondary">{getMostUsed(latestWeek.cookingMethods)}</Badge>
          </div>

          {/* Average Oil Per Meal */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Avg Oil Per Meal</span>
            <Badge variant="outline">{latestWeek.avgOilPerMeal.toFixed(1)} ml</Badge>
          </div>

          {/* Energy Level */}
          {latestWeek.avgEnergyLevel > 0 && (
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Avg Energy Level</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < Math.round(latestWeek.avgEnergyLevel) 
                        ? "bg-success" 
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Improvement Tips */}
          {latestWeek.avgVerificationScore < 70 && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mt-3">
              <p className="text-sm font-medium text-primary mb-1">💡 Boost Your Score</p>
              <p className="text-xs text-muted-foreground">
                Upload more meal photos and provide detailed cooking information to improve your verification score!
              </p>
            </div>
          )}

          {oilTrend && oilTrend.color === "text-success" && (
            <div className="p-3 bg-success/5 rounded-lg border border-success/20 mt-3">
              <p className="text-sm font-medium text-success mb-1">🎉 Great Progress!</p>
              <p className="text-xs text-muted-foreground">
                You've reduced your oil consumption compared to last week. Keep it up!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Weeks (Collapsed) */}
      {weeklySummaries.length > 1 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Previous Weeks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weeklySummaries.slice(0, -1).reverse().map((week) => (
              <div 
                key={week.weekNumber}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">Week {week.weekNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "MMM d")}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{week.mealsLogged}</p>
                    <p className="text-xs text-muted-foreground">meals</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{week.totalOilMl.toFixed(0)}ml</p>
                    <p className="text-xs text-muted-foreground">oil</p>
                  </div>
                  <div className={`text-center ${getScoreColor(week.avgVerificationScore)}`}>
                    <p className="font-medium">{week.avgVerificationScore.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
