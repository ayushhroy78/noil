import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Calendar, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { usePoints } from "@/hooks/usePoints";
import { useAchievements } from "@/hooks/useAchievements";

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  reward_points: number;
  challenge_type: string;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  progress_data: any;
  challenge: Challenge;
}

interface ChallengesTabProps {
  userId: string;
}

export const ChallengesTab = ({ userId }: ChallengesTabProps) => {
  const { t } = useTranslation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { addPoints } = usePoints();
  const { checkAndUnlockAchievements } = useAchievements();

  useEffect(() => {
    fetchChallenges();
  }, [userId]);

  const fetchChallenges = async () => {
    try {
      // Fetch all challenges
      const { data: allChallenges, error: challengesError } = await supabase
        .from("challenges")
        .select("*")
        .order("reward_points", { ascending: false });

      if (challengesError) throw challengesError;

      // Fetch user's challenge progress
      const { data: userProgress, error: progressError } = await supabase
        .from("user_challenges")
        .select(`
          *,
          challenge:challenges(*)
        `)
        .eq("user_id", userId);

      if (progressError) throw progressError;

      setChallenges(allChallenges || []);
      setUserChallenges(userProgress || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase.from("user_challenges").insert({
        user_id: userId,
        challenge_id: challengeId,
        status: "in_progress",
        started_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Challenge started!");
      fetchChallenges();
    } catch (error: any) {
      console.error("Error starting challenge:", error);
      toast.error(error.message || "Failed to start challenge");
    }
  };

  const completeChallenge = async (userChallengeId: string, challengeId: string) => {
    try {
      const { error } = await supabase
        .from("user_challenges")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", userChallengeId);

      if (error) throw error;

      // Award points
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge?.reward_points) {
        addPoints(challenge.reward_points);
      }

      // Check for achievements
      const completedCount = userChallenges.filter(uc => uc.status === "completed").length + 1;
      await checkAndUnlockAchievements("challenges_completed", completedCount);

      toast.success(`Challenge completed! +${challenge?.reward_points || 0} points`);
      fetchChallenges();
    } catch (error: any) {
      console.error("Error completing challenge:", error);
      toast.error(error.message || "Failed to complete challenge");
    }
  };

  const getChallengeProgress = (userChallenge: UserChallenge) => {
    if (!userChallenge.started_at) return 0;
    
    const startDate = new Date(userChallenge.started_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = userChallenge.challenge.duration_days;
    
    return Math.min((daysPassed / totalDays) * 100, 100);
  };

  const getUserChallengeStatus = (challengeId: string) => {
    return userChallenges.find((uc) => uc.challenge_id === challengeId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="default">{t("challenges.inProgress")}</Badge>;
      case "completed":
        return <Badge className="bg-success text-white">{t("challenges.completed")}</Badge>;
      default:
        return <Badge variant="outline">{t("challenges.notStarted")}</Badge>;
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{t("challenges.activeChallenges")}</h2>
      </div>

      {challenges.map((challenge) => {
        const userChallenge = getUserChallengeStatus(challenge.id);
        const isInProgress = userChallenge?.status === "in_progress";
        const isCompleted = userChallenge?.status === "completed";

        return (
          <Card key={challenge.id} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{challenge.duration_days} {t("challenges.days")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-warning" />
                      <span>{challenge.reward_points} {t("challenges.points")}</span>
                    </div>
                  </div>
                </div>
                <div>{userChallenge && getStatusBadge(userChallenge.status)}</div>
              </div>

              {isInProgress && userChallenge && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{t("challenges.progress")}</span>
                    <span>
                      {Math.floor(getChallengeProgress(userChallenge))}% {t("challenges.complete")}
                    </span>
                  </div>
                  <Progress value={getChallengeProgress(userChallenge)} className="h-2" />
                  
                  {getChallengeProgress(userChallenge) >= 100 && (
                    <Button
                      onClick={() => completeChallenge(userChallenge.id, challenge.id)}
                      size="sm"
                      className="w-full mt-3"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t("challenges.markComplete")}
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Complete
                    </Button>
                  )}
                </div>
              )}

              {!userChallenge && (
                <Button
                  onClick={() => startChallenge(challenge.id)}
                  size="sm"
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t("challenges.startChallenge")}
                </Button>
              )}

              {isCompleted && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("challenges.completed")}! +{challenge.reward_points} {t("challenges.earnedPoints")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
