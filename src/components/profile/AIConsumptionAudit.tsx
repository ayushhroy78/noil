import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useTracking } from "@/hooks/useTracking";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import { jsPDF } from "jspdf";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Lightbulb,
  Target,
  Download,
  History,
  BarChart3,
  Calendar,
  Trash2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface StoredAudit {
  id: string;
  audit_date: string;
  overall_risk: string;
  risk_score: number;
  insights: string[];
  recommendations: string[];
  health_indicators: AuditResult["healthIndicators"];
  consumption_trend: string;
  weekly_analysis: string;
  daily_consumption: number;
  weekly_consumption: number;
  monthly_consumption: number;
  health_score: number;
}

export const AIConsumptionAudit = ({ userId }: AIConsumptionAuditProps) => {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAuditDate, setLastAuditDate] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<StoredAudit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedHistoryAudit, setSelectedHistoryAudit] = useState<StoredAudit | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { data: trackingData, loading: trackingLoading } = useTracking(userId);
  const { profile, profileLoading } = useHealthProfile(userId);

  // Fetch audit history
  const fetchAuditHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("consumption_audits")
        .select("*")
        .eq("user_id", userId)
        .order("audit_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        insights: Array.isArray(item.insights) ? item.insights as string[] : [],
        recommendations: Array.isArray(item.recommendations) ? item.recommendations as string[] : [],
        health_indicators: Array.isArray(item.health_indicators) ? item.health_indicators as AuditResult["healthIndicators"] : [],
      }));
      
      setAuditHistory(typedData);
    } catch (error) {
      console.error("Error fetching audit history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAuditHistory();
    }
  }, [userId]);

  // Save audit to history
  const saveAuditToHistory = async (result: AuditResult) => {
    try {
      const { error } = await supabase.from("consumption_audits").insert({
        user_id: userId,
        overall_risk: result.overallRisk,
        risk_score: result.riskScore,
        insights: result.insights,
        recommendations: result.recommendations,
        health_indicators: result.healthIndicators,
        consumption_trend: result.consumptionTrend,
        weekly_analysis: result.weeklyAnalysis,
        daily_consumption: trackingData.consumption.today,
        weekly_consumption: trackingData.consumption.weekly,
        monthly_consumption: trackingData.consumption.monthly,
        health_score: trackingData.healthScore.todayScore,
      });

      if (error) throw error;
      fetchAuditHistory();
    } catch (error) {
      console.error("Error saving audit:", error);
    }
  };

  // Delete audit from history
  const deleteAudit = async (auditId: string) => {
    try {
      const { error } = await supabase
        .from("consumption_audits")
        .delete()
        .eq("id", auditId);

      if (error) throw error;
      toast.success("Audit deleted");
      fetchAuditHistory();
      if (selectedHistoryAudit?.id === auditId) {
        setSelectedHistoryAudit(null);
      }
    } catch (error) {
      console.error("Error deleting audit:", error);
      toast.error("Failed to delete audit");
    }
  };

  // Export to PDF
  const exportToPDF = async (audit: AuditResult | StoredAudit, auditDate?: string) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(23, 162, 184); // Primary teal color
      doc.text("Noil - AI Consumption Audit Report", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(100);
      const dateStr = auditDate ? format(new Date(auditDate), "PPpp") : format(new Date(), "PPpp");
      doc.text(`Generated: ${dateStr}`, pageWidth / 2, yPos, { align: "center" });

      // Risk Assessment Section
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Risk Assessment", 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      const riskLevel = 'overall_risk' in audit ? audit.overall_risk : audit.overallRisk;
      const riskScore = 'risk_score' in audit ? audit.risk_score : audit.riskScore;
      doc.text(`Overall Risk Level: ${riskLevel.toUpperCase()}`, 20, yPos);
      yPos += 7;
      doc.text(`Health Safety Score: ${100 - riskScore}%`, 20, yPos);

      // Health Indicators
      yPos += 15;
      doc.setFontSize(14);
      doc.text("Health Indicators", 20, yPos);
      
      const indicators = 'health_indicators' in audit ? audit.health_indicators : audit.healthIndicators;
      indicators.forEach((indicator) => {
        yPos += 10;
        doc.setFontSize(10);
        doc.text(`• ${indicator.name}: ${indicator.value} - ${indicator.description}`, 25, yPos);
      });

      // Key Insights
      const insights = 'insights' in audit && Array.isArray(audit.insights) ? audit.insights : [];
      if (insights.length > 0) {
        yPos += 15;
        doc.setFontSize(14);
        doc.text("Key Insights", 20, yPos);
        
        insights.forEach((insight: string) => {
          yPos += 10;
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(`• ${insight}`, pageWidth - 45);
          doc.text(lines, 25, yPos);
          yPos += (lines.length - 1) * 5;
        });
      }

      // Recommendations
      const recommendations = 'recommendations' in audit && Array.isArray(audit.recommendations) ? audit.recommendations : [];
      if (recommendations.length > 0) {
        yPos += 15;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text("Recommendations", 20, yPos);
        
        recommendations.forEach((rec: string, index: number) => {
          yPos += 10;
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 45);
          doc.text(lines, 25, yPos);
          yPos += (lines.length - 1) * 5;
        });
      }

      // Weekly Analysis
      const weeklyAnalysis = 'weekly_analysis' in audit ? audit.weekly_analysis : audit.weeklyAnalysis;
      if (weeklyAnalysis) {
        yPos += 15;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text("Weekly Analysis", 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(weeklyAnalysis, pageWidth - 40);
        doc.text(lines, 20, yPos);
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount} | Noil - Track. Cook. Thrive.`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `noil-audit-${format(new Date(auditDate || new Date()), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const runAIAudit = async () => {
    setIsAnalyzing(true);
    
    try {
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
      await saveAuditToHistory(response.data);
      toast.success("AI audit completed and saved");
    } catch (error) {
      console.error("Audit error:", error);
      performLocalAnalysis(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performLocalAnalysis = (saveToHistory = false) => {
    const healthScore = trackingData.healthScore.todayScore;
    const dailyConsumption = trackingData.consumption.today;
    const weeklyConsumption = trackingData.consumption.weekly;
    const hiddenOilPercentage = trackingData.consumption.today > 0 
      ? (trackingData.consumption.hiddenOil / trackingData.consumption.today) * 100 
      : 0;

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

    if (dailyConsumption > 25) {
      insights.push(`Your daily oil consumption (${dailyConsumption.toFixed(1)}ml) exceeds the recommended 20-25ml limit.`);
      recommendations.push("Try reducing oil in your cooking by using non-stick cookware or air frying methods.");
    }

    if (hiddenOilPercentage > 30) {
      insights.push(`${hiddenOilPercentage.toFixed(0)}% of your oil intake comes from packaged foods.`);
      recommendations.push("Check nutrition labels and choose products with lower fat content.");
    }

    if (healthScore < 60) {
      insights.push("Your health score indicates room for improvement in your oil consumption habits.");
      recommendations.push("Focus on using healthier oils like olive, mustard, or groundnut oil.");
    }

    if (weeklyConsumption > 175) {
      insights.push(`Weekly consumption of ${weeklyConsumption.toFixed(0)}ml is above the healthy limit.`);
      recommendations.push("Plan your meals ahead to control oil usage throughout the week.");
    }

    if (healthScore >= 80) {
      insights.push("Excellent! Your health score shows healthy oil consumption habits.");
    }

    if (dailyConsumption <= 20) {
      insights.push("Great job! Your daily oil intake is within the optimal range.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Keep up the good work! Continue monitoring your oil intake regularly.");
      recommendations.push("Try new low-oil recipes from the Fit Meal section.");
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

    const result: AuditResult = {
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
          ? "Your consumption has increased recently - consider adjustments."
          : "Your consumption has been stable - maintain your current habits."
      }`,
    };

    setAuditResult(result);
    setLastAuditDate(new Date().toISOString());

    if (saveToHistory) {
      saveAuditToHistory(result);
    }
  };

  useEffect(() => {
    if (!trackingLoading && !profileLoading && userId) {
      performLocalAnalysis();
    }
  }, [trackingLoading, profileLoading, userId, trackingData]);

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "low": return "default";
      case "moderate": return "secondary";
      case "high": return "outline";
      case "critical": return "destructive";
      default: return "secondary";
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

  const renderAuditContent = (audit: AuditResult | StoredAudit, isHistory = false) => {
    const riskLevel = 'overall_risk' in audit ? audit.overall_risk : audit.overallRisk;
    const riskScore = 'risk_score' in audit ? audit.risk_score : audit.riskScore;
    const indicators = 'health_indicators' in audit ? audit.health_indicators : audit.healthIndicators;
    const insights = 'insights' in audit && Array.isArray(audit.insights) ? audit.insights : [];
    const recommendations = 'recommendations' in audit && Array.isArray(audit.recommendations) ? audit.recommendations : [];
    const weeklyAnalysis = 'weekly_analysis' in audit ? audit.weekly_analysis : audit.weeklyAnalysis;
    const trend = 'consumption_trend' in audit ? audit.consumption_trend : audit.consumptionTrend;

    return (
      <div className="space-y-4">
        {/* Risk Summary */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Risk Level:</span>
                <Badge variant={getRiskBadgeVariant(riskLevel)} className="capitalize">
                  {riskLevel}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {trend === "improving" ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : trend === "declining" ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <Activity className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-xs capitalize">{trend}</span>
              </div>
            </div>
            <Progress value={100 - riskScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Health safety score: {100 - riskScore}%
            </p>
          </CardContent>
        </Card>

        {/* Health Indicators */}
        <div className="grid grid-cols-2 gap-3">
          {indicators.map((indicator, index) => (
            <Card key={index} className={`border ${getStatusColor(indicator.status)}`}>
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

        {/* Insights */}
        {insights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Key Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-muted-foreground">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Weekly Analysis */}
        {weeklyAnalysis && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Weekly Analysis</p>
                  <p className="text-sm text-muted-foreground">{weeklyAnalysis}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => exportToPDF(audit, isHistory && 'audit_date' in audit ? audit.audit_date : undefined)}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export as PDF
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
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
                    ? `Last analyzed: ${format(new Date(lastAuditDate), "PPp")}`
                    : "Analyzing your consumption patterns..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Info className="w-4 h-4 text-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-card border-border" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-warning" />
                      <h4 className="font-semibold text-foreground">How to Maintain Your Score</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">Keep daily oil intake under 20-25ml for optimal health</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">Use healthier oils like olive, mustard, or groundnut</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">Reduce packaged foods with hidden oils</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">Log meals consistently to track progress</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">Try air frying or steaming instead of deep frying</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        💡 <span className="font-medium">Pro tip:</span> Running weekly audits helps identify patterns and improve your score faster!
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Current/History */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current" className="text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Current Audit
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            <History className="w-4 h-4 mr-2" />
            History ({auditHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          {auditResult && renderAuditContent(auditResult)}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : auditHistory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No audit history yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Run an AI audit to start building your history
                </p>
              </CardContent>
            </Card>
          ) : selectedHistoryAudit ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedHistoryAudit(null)}
                >
                  ← Back to list
                </Button>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedHistoryAudit.audit_date), "PPp")}
                </p>
              </div>
              {renderAuditContent(selectedHistoryAudit, true)}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {auditHistory.map((audit) => (
                  <Card 
                    key={audit.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1"
                          onClick={() => setSelectedHistoryAudit(audit)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(audit.audit_date), "PPP")}
                            </span>
                            <Badge variant={getRiskBadgeVariant(audit.overall_risk)} className="capitalize text-xs">
                              {audit.overall_risk}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Score: {100 - audit.risk_score}%</span>
                            <span>Daily: {audit.daily_consumption?.toFixed(1) || 0}ml</span>
                            <span>Health: {audit.health_score || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToPDF(audit, audit.audit_date);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAudit(audit.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
