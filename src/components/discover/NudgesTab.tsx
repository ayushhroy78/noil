import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Calendar,
  Activity,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface NudgeTemplate {
  id: string;
  template_text: string;
  trigger_type: string;
  priority: number;
  icon: string | null;
}

interface TrackingData {
  todayConsumption: number;
  weeklyConsumption: number;
  monthlyConsumption: number;
  healthScore: number;
  hiddenOilPercentage: number;
}

interface NudgesTabProps {
  userId: string;
}

export const NudgesTab = ({ userId }: NudgesTabProps) => {
  const { t } = useTranslation();
  const [nudges, setNudges] = useState<NudgeTemplate[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNudgesAndData();
  }, [userId]);

  const fetchNudgesAndData = async () => {
    try {
      // Fetch tracking data for personalized nudges
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { data: logs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", weekAgo);

      const { data: scans } = await supabase
        .from("barcode_scans")
        .select("*")
        .eq("user_id", userId)
        .gte("scan_date", weekAgo);

      const { data: healthScores } = await supabase
        .from("health_scores")
        .select("*")
        .eq("user_id", userId)
        .order("score_date", { ascending: false })
        .limit(7);

      // Calculate metrics
      const todayLogs = logs?.filter((log) => log.log_date === today) || [];
      const todayScans = scans?.filter((scan) => scan.scan_date.split("T")[0] === today) || [];
      
      const todayConsumption = 
        todayLogs.reduce((sum, log) => sum + Number(log.amount_ml), 0) +
        todayScans.reduce((sum, scan) => sum + Number(scan.oil_content_ml), 0);

      const weeklyConsumption = 
        (logs || []).reduce((sum, log) => sum + Number(log.amount_ml), 0) +
        (scans || []).reduce((sum, scan) => sum + Number(scan.oil_content_ml), 0);

      const hiddenOil = (scans || []).reduce((sum, scan) => sum + Number(scan.oil_content_ml), 0);
      const hiddenOilPercentage = weeklyConsumption > 0 ? (hiddenOil / weeklyConsumption) * 100 : 0;

      const currentScore = healthScores?.[0]?.score || 0;
      const previousScore = healthScores?.[1]?.score || 0;

      setTrackingData({
        todayConsumption,
        weeklyConsumption,
        monthlyConsumption: 0,
        healthScore: currentScore,
        hiddenOilPercentage,
      });

      // Generate weekly report
      const avgScore = healthScores?.length 
        ? healthScores.reduce((sum, s) => sum + s.score, 0) / healthScores.length 
        : 0;

      const dailyConsumptions = logs?.map(log => Number(log.amount_ml)) || [];
      const bestDay = Math.min(...dailyConsumptions);
      const worstDay = Math.max(...dailyConsumptions);

      setWeeklyReport({
        avgScore: avgScore.toFixed(0),
        totalOil: weeklyConsumption.toFixed(1),
        hiddenOilPercentage: hiddenOilPercentage.toFixed(0),
        bestDay: bestDay === Infinity ? 0 : bestDay.toFixed(1),
        worstDay: worstDay === -Infinity ? 0 : worstDay.toFixed(1),
      });

      // Fetch and filter relevant nudges
      const { data: templates } = await supabase
        .from("nudge_templates")
        .select("*")
        .order("priority", { ascending: true });

      const relevantNudges: NudgeTemplate[] = [];

      templates?.forEach((template) => {
        if (template.trigger_type === "health_score_drop" && currentScore < previousScore) {
          relevantNudges.push(template);
        }
        if (template.trigger_type === "high_hidden_oil" && hiddenOilPercentage > 40) {
          relevantNudges.push(template);
        }
        if (template.trigger_type === "low_oil_week" && weeklyConsumption < 150) {
          relevantNudges.push(template);
        }
        if (template.trigger_type === "no_tracking" && logs?.length === 0) {
          relevantNudges.push(template);
        }
      });

      setNudges(relevantNudges.slice(0, 5));
    } catch (error) {
      console.error("Error fetching nudges:", error);
      toast.error("Failed to load personalized tips");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    switch (iconName) {
      case "TrendingDown":
        return TrendingDown;
      case "TrendingUp":
        return TrendingUp;
      case "AlertCircle":
        return AlertCircle;
      case "Lightbulb":
        return Lightbulb;
      case "Calendar":
        return Calendar;
      default:
        return Activity;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Report */}
      {weeklyReport && (
        <Card className="shadow-medium bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t("discover.weekSummary")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">{weeklyReport.avgScore}</div>
                <div className="text-xs text-muted-foreground">{t("discover.avgHealthScore")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{weeklyReport.totalOil}ml</div>
                <div className="text-xs text-muted-foreground">{t("discover.totalOil")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">{weeklyReport.hiddenOilPercentage}%</div>
                <div className="text-xs text-muted-foreground">{t("discover.fromPackagedFoods")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{weeklyReport.bestDay}ml</div>
                <div className="text-xs text-muted-foreground">{t("discover.bestDay")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Nudges */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t("discover.todaysTips")}</h2>
        </div>

        {nudges.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-foreground font-medium">{t("discover.doingGreat")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("discover.keepHealthyHabits")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {nudges.map((nudge) => {
              const Icon = getIcon(nudge.icon);
              
              return (
                <Card key={nudge.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{nudge.template_text}</p>
                        {nudge.priority === 1 && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            {t("discover.highPriority")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
