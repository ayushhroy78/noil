import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengesTab } from "@/components/discover/ChallengesTab";
import { QuizzesTab } from "@/components/discover/QuizzesTab";
import { HealthInfoTab } from "@/components/discover/HealthInfoTab";
import { NudgesTab } from "@/components/discover/NudgesTab";
import { LeaderboardTab } from "@/components/discover/LeaderboardTab";
import { BadgesSection } from "@/components/discover/BadgesSection";
import { PointsDisplay } from "@/components/discover/PointsDisplay";
import { RewardsStore } from "@/components/discover/RewardsStore";
import { supabase } from "@/integrations/supabase/client";

const Discover = () => {
  const navigate = useNavigate();
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
            <h1 className="text-xl font-bold text-foreground">Discover</h1>
            <p className="text-xs text-muted-foreground">Learn & Grow Healthier</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        {userId && (
          <div className="mb-6">
            <PointsDisplay />
          </div>
        )}

        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="challenges" className="text-xs px-2">Challenges</TabsTrigger>
            <TabsTrigger value="quizzes" className="text-xs px-2">Quizzes</TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs px-2">Rewards</TabsTrigger>
            <TabsTrigger value="info" className="text-xs px-2">Info</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs px-2">Tips</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs px-2">Leaders</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            {userId ? (
              <ChallengesTab userId={userId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please log in to view challenges
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

          <TabsContent value="rewards">
            <RewardsStore userId={userId} />
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

        {userId && (
          <div className="mt-8">
            <BadgesSection />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Discover;
