import { useEffect, useState } from "react";
import { ArrowLeft, Store, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { QuizzesTab } from "@/components/discover/QuizzesTab";
import { HealthInfoTab } from "@/components/discover/HealthInfoTab";
import { NudgesTab } from "@/components/discover/NudgesTab";
import { LeaderboardTab } from "@/components/discover/LeaderboardTab";
import { EnhancedChallengesTab } from "@/components/discover/EnhancedChallengesTab";
import { supabase } from "@/integrations/supabase/client";

const Discover = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

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
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('discover.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('discover.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <Card 
          className="mb-6 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
          onClick={() => navigate("/restaurants")}
          data-testid="card-restaurants"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Store className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-200">Healthy Restaurants</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Find restaurants that cook with healthy oils
                </p>
              </div>
              <MapPin className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="challenges" className="text-xs px-1">{t('discover.challenges')}</TabsTrigger>
            <TabsTrigger value="quizzes" className="text-xs px-1" data-testid="tab-quizzes">{t('discover.quizzes')}</TabsTrigger>
            <TabsTrigger value="info" className="text-xs px-1" data-testid="tab-info">{t('discover.healthInfo')}</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs px-1" data-testid="tab-tips">{t('discover.nudges')}</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs px-1" data-testid="tab-leaderboard">{t('discover.leaderboard')}</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            {userId ? (
              <EnhancedChallengesTab userId={userId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please log in to participate in challenges
              </div>
            )}
          </TabsContent>

          <TabsContent value="quizzes">
            {userId ? (
              <QuizzesTab userId={userId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please log in to take quizzes
              </div>
            )}
          </TabsContent>

          <TabsContent value="info">
            <HealthInfoTab />
          </TabsContent>

          <TabsContent value="tips">
            {userId ? (
              <NudgesTab userId={userId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please log in to view personalized tips
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Discover;
