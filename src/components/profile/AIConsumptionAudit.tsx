import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useTracking } from "@/hooks/useTracking";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Heart,
  Droplets,
  Activity,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Lightbulb,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface AIConsumptionAuditProps {
  userId: string;
}

interface AuditResult {
  overallRisk: "low" | "moderate" | "high" | "critical";
  riskScore: number;
  insights: string[];
  recommendations: string[];
  healthIndicators: {
    name: string;
    status: "good" | "warning" | "danger";
    value: string;
    description: string;
  }[];
  consumptionTrend: "improving" | "stable" | "declining";
  weeklyAnalysis: string;
}

export const AIConsumptionAudit = ({ userId }: AIConsumptionAuditProps) => {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAuditDate, setLastAuditDate] = useState<string | null>(null);
  const [trackedMealsCount, setTrackedMealsCount] = useState(0);
  const { data: trackingData, loading: trackingLoading } = useTracking(userId);
  const { profile, profileLoading } = useHealthProfile(userId);

  const runAIAudit = async () => {
    setIsAnalyzing(true);
    
    try {
      // Fetch consumption data for analysis
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(30);

      const { data: scans } = await supabase
        .from("barcode_scans")
        .select("*")
        .eq("user_id", userId)
        .order("scan_date", { ascending: false })
        .limit(30);

      const { data: bottles } = await supabase
        .from("bottles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Call AI for analysis
      const response = await supabase.functions.invoke("consumption-audit", {
        body: {
          logs: logs || [],
          scans: scans || [],
          bottles: bottles || [],
          profile: profile || {},
          trackingData: trackingData,
        },
      });

      if (response.error) throw response.error;

      setAuditResult(response.data);
      setLastAuditDate(new Date().toISOString());
      setTrackedMealsCount(logs?.length || 0);
      toast.success("AI audit completed successfully");
    } catch (error) {
      console.error("Audit error:", error);
      // Fallback to local analysis if AI fails
      performLocalAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performLocalAnalysis = () => {
    const healthScore = trackingData.healthScore.todayScore;
    const dailyConsumption = trackingData.consumption.today;
    const weeklyConsumption = trackingData.consumption.weekly;
    const hiddenOilPercentage = trackingData.consumption.today > 0 
      ? (trackingData.consumption.hiddenOil / trackingData.consumption.today) * 100 
      : 0;

    // Calculate risk level
    let riskScore = 0;
    if (dailyConsumption > 30) riskScore += 30;
    else if (dailyConsumption > 25) riskScore += 15;
    
    if (hiddenOilPercentage > 40) riskScore += 25;
    else if (hiddenOilPercentage > 25) riskScore += 10;
    
    if (healthScore < 50) riskScore += 30;
    else if (healthScore < 70) riskScore += 15;

    const overallRisk: AuditResult["overallRisk"] = 
      riskScore >= 60 ? "critical" :
      riskScore >= 40 ? "high" :
      riskScore >= 20 ? "moderate" : "low";

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Generate insights based on data
    if (dailyConsumption > 25) {
      insights.push(`Your daily oil consumption (${dailyConsumption.toFixed(1)}ml) exceeds the recommended 20-25ml limit.`);
      recommendations.push("Try reducing oil in your cooking by using non-stick cookware or air frying methods.");
    }

    if (hiddenOilPercentage > 30) {
      insights.push(`${hiddenOilPercentage.toFixed(0)}% of your oil intake comes from packaged foods - this hidden oil adds up quickly.`);
      recommendations.push("Check nutrition labels and choose products with lower fat content.");
    }

    if (healthScore < 60) {
      insights.push("Your health score indicates room for improvement in your oil consumption habits.");
      recommendations.push("Focus on using healthier oils like olive, mustard, or groundnut oil for cooking.");
    }

    if (weeklyConsumption > 175) {
      insights.push(`Weekly consumption of ${weeklyConsumption.toFixed(0)}ml is above the healthy weekly limit.`);
      recommendations.push("Plan your meals ahead to control oil usage throughout the week.");
    }

    // Add positive insights if doing well
    if (healthScore >= 80) {
      insights.push("Excellent! Your health score shows you're maintaining healthy oil consumption habits.");
    }

    if (dailyConsumption <= 20) {
      insights.push("Great job! Your daily oil intake is within the optimal range.");
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push("Keep up the good work! Continue monitoring your oil intake regularly.");
      recommendations.push("Try new low-oil recipes from the Fit Meal section to maintain variety.");
    }

    const healthIndicators = [
      {
        name: "Daily Consumption",
        status: dailyConsumption <= 20 ? "good" : dailyConsumption <= 30 ? "warning" : "danger",
        value: `${dailyConsumption.toFixed(1)}ml`,
        description: dailyConsumption <= 20 ? "Within healthy limits" : "Consider reducing intake",
      },
      {
        name: "Hidden Oil Ratio",
        status: hiddenOilPercentage <= 20 ? "good" : hiddenOilPercentage <= 40 ? "warning" : "danger",
        value: `${hiddenOilPercentage.toFixed(0)}%`,
        description: hiddenOilPercentage <= 20 ? "Low processed food intake" : "High packaged food consumption",
      },
      {
        name: "Health Score",
        status: healthScore >= 80 ? "good" : healthScore >= 50 ? "warning" : "danger",
        value: `${healthScore}/100`,
        description: healthScore >= 80 ? "Excellent health habits" : "Needs improvement",
      },
      {
        name: "Weekly Trend",
        status: weeklyConsumption <= 150 ? "good" : weeklyConsumption <= 200 ? "warning" : "danger",
        value: `${weeklyConsumption.toFixed(0)}ml`,
        description: weeklyConsumption <= 150 ? "On track this week" : "Weekly goal exceeded",
      },
    ] as AuditResult["healthIndicators"];

    const consumptionTrend: AuditResult["consumptionTrend"] = 
      trackingData.healthScore.trend === "up" ? "improving" :
      trackingData.healthScore.trend === "down" ? "declining" : "stable";

    setAuditResult({
      overallRisk,
      riskScore,
      insights,
      recommendations,
      healthIndicators,
      consumptionTrend,
      weeklyAnalysis: `Based on your tracked meals this month, your oil consumption patterns have been analyzed. ${
        consumptionTrend === "improving" 
          ? "Your consumption is trending downward - great progress!" 
          : consumptionTrend === "declining"
          ? "Your consumption has increased recently - consider making adjustments."
          : "Your consumption has been stable - maintain your current habits."
      }`,
    });
    
    setLastAuditDate(new Date().toISOString());
  };

  useEffect(() => {
    if (!trackingLoading && !profileLoading && userId) {
      performLocalAnalysis();
    }
  }, [trackingLoading, profileLoading, userId, trackingData]);

  const getRiskColor = (risk: AuditResult["overallRisk"]) => {
    switch (risk) {
      case "low": return "bg-green-500";
      case "moderate": return "bg-yellow-500";
      case "high": return "bg-orange-500";
      case "critical": return "bg-red-500";
    }
  };

  const getRiskBadgeVariant = (risk: AuditResult["overallRisk"]) => {
    switch (risk) {
      case "low": return "default";
      case "moderate": return "secondary";
      case "high": return "outline";
      case "critical": return "destructive";
    }
  };

  const getStatusIcon = (status: "good" | "warning" | "danger") => {
    switch (status) {
      case "good": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "danger": return <ShieldAlert className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: "good" | "warning" | "danger") => {
    switch (status) {
      case "good": return "border-green-500/30 bg-green-500/5";
      case "warning": return "border-yellow-500/30 bg-yellow-500/5";
      case "danger": return "border-red-500/30 bg-red-500/5";
    }
  };

  if (trackingLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Audit Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Consumption Audit</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {lastAuditDate 
                    ? `Last analyzed: ${new Date(lastAuditDate).toLocaleString()}`
                    : "Analyzing your consumption patterns..."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runAIAudit}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {auditResult && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge variant={getRiskBadgeVariant(auditResult.overallRisk)} className="capitalize">
                    {auditResult.overallRisk}
                  </Badge>
                </div>
                <Progress 
                  value={100 - auditResult.riskScore} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Health safety score: {100 - auditResult.riskScore}%
                </p>
              </div>
              <div className="flex items-center gap-1">
                {auditResult.consumptionTrend === "improving" ? (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                ) : auditResult.consumptionTrend === "declining" ? (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ) : (
                  <Activity className="w-5 h-5 text-yellow-500" />
                )}
                <span className="text-xs capitalize">{auditResult.consumptionTrend}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Indicators Grid */}
      {auditResult && (
        <div className="grid grid-cols-2 gap-3">
          {auditResult.healthIndicators.map((indicator, index) => (
            <Card 
              key={index} 
              className={`border ${getStatusColor(indicator.status)}`}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {indicator.name}
                  </span>
                  {getStatusIcon(indicator.status)}
                </div>
                <p className="text-xl font-bold">{indicator.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {indicator.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Insights */}
      {auditResult && auditResult.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Key Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditResult.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-muted-foreground">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {auditResult && auditResult.recommendations.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditResult.recommendations.map((rec, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
              >
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly Analysis Summary */}
      {auditResult && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Weekly Analysis</p>
                <p className="text-sm text-muted-foreground">
                  {auditResult.weeklyAnalysis}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
