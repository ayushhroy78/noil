import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottleTracking } from "@/components/tracking/BottleTracking";
import { DailyLogForm } from "@/components/tracking/DailyLogForm";
import { ConsumptionSummary } from "@/components/tracking/ConsumptionSummary";
import { HealthScoreCard } from "@/components/tracking/HealthScoreCard";
import { InsightsSection } from "@/components/tracking/InsightsSection";
import { useTracking } from "@/hooks/useTracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tracker = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Oil Tracker</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Health Score - Featured */}
        <HealthScoreCard data={data.healthScore} />

        {/* Consumption Summary */}
        <ConsumptionSummary data={data.consumption} />

        {/* Insights */}
        <InsightsSection insights={data.insights} />

        {/* Tracking Forms */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Daily Log</TabsTrigger>
            <TabsTrigger value="bottle">Bottle Tracking</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-4">
            {userId && <DailyLogForm userId={userId} onLogAdded={refetch} />}
          </TabsContent>
          <TabsContent value="bottle" className="mt-4">
            {userId && <BottleTracking userId={userId} onBottleAdded={refetch} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Tracker;
