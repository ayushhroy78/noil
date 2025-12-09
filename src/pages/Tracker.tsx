import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottleTracking } from "@/components/tracking/BottleTracking";
import { DailyLogForm } from "@/components/tracking/DailyLogForm";
import { ConsumptionSummary } from "@/components/tracking/ConsumptionSummary";
import { HealthScoreCard } from "@/components/tracking/HealthScoreCard";
import { InsightsSection } from "@/components/tracking/InsightsSection";
import { BarcodeScanner } from "@/components/tracking/BarcodeScanner";
import { ProgressCharts } from "@/components/tracking/ProgressCharts";
import { DailyGoalTracker } from "@/components/tracking/DailyGoalTracker";
import { IoTDeviceManager } from "@/components/tracking/IoTDeviceManager";
import { OilTypeChart } from "@/components/tracking/OilTypeChart";
import { WeeklyOilTrends } from "@/components/tracking/WeeklyOilTrends";
import { OilRecommendations } from "@/components/tracking/OilRecommendations";
import { useTracking } from "@/hooks/useTracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tracker = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | undefined>();
  const { data, loading, refetch } = useTracking(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user?.id);
    };
    getUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <TopNav title={t('tracker.title')} showBackButton />

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Daily Goal Tracker - Featured */}
        <DailyGoalTracker todayConsumption={data.consumption.today} />

        {/* Health Score */}
        <HealthScoreCard data={data.healthScore} />

        {/* Consumption Summary */}
        <ConsumptionSummary data={data.consumption} />

        {/* Insights */}
        <InsightsSection insights={data.insights} />

        {/* Oil Type Breakdown */}
        {userId && <OilTypeChart userId={userId} />}

        {/* Weekly Oil Type Trends */}
        {userId && <WeeklyOilTrends userId={userId} />}

        {/* Oil Recommendations */}
        {userId && <OilRecommendations userId={userId} />}

        {/* Progress Charts */}
        {userId && <ProgressCharts userId={userId} />}

        {/* Tracking Forms */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur">
            <TabsTrigger value="daily">{t('tracker.dailyLog')}</TabsTrigger>
            <TabsTrigger value="bottle">{t('tracker.bottle')}</TabsTrigger>
            <TabsTrigger value="scan">{t('tracker.barcodeScan')}</TabsTrigger>
            <TabsTrigger value="iot">IoT</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-4">
            {userId && <DailyLogForm userId={userId} onLogAdded={refetch} />}
          </TabsContent>
          <TabsContent value="bottle" className="mt-4">
            {userId && <BottleTracking userId={userId} onBottleAdded={refetch} />}
          </TabsContent>
          <TabsContent value="scan" className="mt-4">
            {userId && <BarcodeScanner userId={userId} onScanComplete={refetch} />}
          </TabsContent>
          <TabsContent value="iot" className="mt-4">
            {userId && <IoTDeviceManager userId={userId} onRefetch={refetch} />}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Tracker;
