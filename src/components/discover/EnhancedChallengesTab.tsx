import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Calendar, Play, CheckCircle2, ArrowRight, 
  Flame, Target, Shield, AlertCircle, Clock, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { usePoints } from "@/hooks/usePoints";
import { useAchievements } from "@/hooks/useAchievements";
import { useChallengeTracking } from "@/hooks/useChallengeTracking";
import { ChallengeCheckInForm, CheckInFormData } from "./ChallengeCheckInForm";
import { ChallengeStreakCalendar } from "./ChallengeStreakCalendar";
import { ChallengeWeeklySummary } from "./ChallengeWeeklySummary";
import { format, differenceInDays, parseISO } from "date-fns";

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

interface EnhancedChallengesTabProps {
  userId: string;
}

export const EnhancedChallengesTab = ({ userId }: EnhancedChallengesTabProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState<UserChallenge | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  const { addPoints } = usePoints();
  const { checkAndUnlockAchievements } = useAchievements();

  const {
    checkIns,
    todayCheckIns,
    streak,
    dailyPrompt,
    addCheckIn,
    uploadMealPhoto,
    generateDailyPrompt,
    answerDailyPrompt,
    getCalendarData,
    refetch: refetchTracking,
  } = useChallengeTracking(userId, activeChallenge?.id || null);

  useEffect(() => {
    fetchChallenges();
  }, [userId]);

  useEffect(() => {
    // Auto-select first in-progress challenge
    const inProgressChallenge = userChallenges.find(uc => uc.status === "in_progress");
    if (inProgressChallenge && !activeChallenge) {
      setActiveChallenge(inProgressChallenge);
    }
  }, [userChallenges, activeChallenge]);

  useEffect(() => {
    // Generate daily prompt when active challenge is set
    if (activeChallenge?.started_at) {
      generateDailyPrompt(activeChallenge.started_at);
    }
  }, [activeChallenge?.id, activeChallenge?.started_at, generateDailyPrompt]);

  const fetchChallenges = async () => {
    try {
      const { data: allChallenges, error: challengesError } = await supabase
        .from("challenges")
        .select("*")
        .order("reward_points", { ascending: false });

      if (challengesError) throw challengesError;

      const { data: userProgress, error: progressError } = await supabase
        .from("user_challenges")
        .select(`*, challenge:challenges(*)`)
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
      const startedAt = new Date().toISOString();
      const { data, error } = await supabase.from("user_challenges").insert({
        user_id: userId,
        challenge_id: challengeId,
        status: "in_progress",
        started_at: startedAt,
      }).select(`*, challenge:challenges(*)`).single();

      if (error) throw error;

      // Initialize streak for the new challenge
      const today = format(new Date(), "yyyy-MM-dd");
      await supabase.from("challenge_streaks").insert({
        user_id: userId,
        user_challenge_id: data.id,
        current_streak: 0,
        best_streak: 0,
        last_check_in_date: null,
        streak_start_date: today,
        total_check_ins: 0,
        missed_days: 0,
      });

      toast.success("Challenge started! Begin your daily check-ins.");
      setActiveChallenge(data);
      setViewMode("detail");
      await fetchChallenges();
      await refetchTracking();
    } catch (error: any) {
      console.error("Error starting challenge:", error);
      toast.error(error.message || "Failed to start challenge");
    }
  };

  const completeChallenge = async () => {
    if (!activeChallenge) return;

    try {
      const { error } = await supabase
        .from("user_challenges")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", activeChallenge.id);

      if (error) throw error;

      // Award points based on verification score
      const avgVerificationScore = checkIns.length > 0
        ? checkIns.reduce((sum, c) => sum + (c.verification_score || 0), 0) / checkIns.length
        : 50;

      const bonusMultiplier = avgVerificationScore >= 80 ? 1.5 : avgVerificationScore >= 60 ? 1.2 : 1;
      const basePoints = activeChallenge.challenge.reward_points || 0;
      const totalPoints = Math.round(basePoints * bonusMultiplier);

      addPoints(totalPoints);

      // Check achievements
      const completedCount = userChallenges.filter(uc => uc.status === "completed").length + 1;
      await checkAndUnlockAchievements("challenges_completed", completedCount);

      toast.success(`🎉 Challenge completed! +${totalPoints} points earned!`);
      setViewMode("list");
      setActiveChallenge(null);
      fetchChallenges();
    } catch (error: any) {
      console.error("Error completing challenge:", error);
      toast.error(error.message || "Failed to complete challenge");
    }
  };

  const handleCheckIn = async (data: CheckInFormData) => {
    return await addCheckIn(data);
  };

  const getChallengeProgress = (userChallenge: UserChallenge) => {
    if (!userChallenge.started_at) return 0;
    const daysPassed = differenceInDays(new Date(), parseISO(userChallenge.started_at));
    return Math.min((daysPassed / userChallenge.challenge.duration_days) * 100, 100);
  };

  const getUserChallengeStatus = (challengeId: string) => {
    return userChallenges.find((uc) => uc.challenge_id === challengeId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="default">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-success text-white">Completed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Detail View for Active Challenge
  if (viewMode === "detail" && activeChallenge) {
    const progress = getChallengeProgress(activeChallenge);
    const daysRemaining = Math.max(
      0,
      activeChallenge.challenge.duration_days - 
        differenceInDays(new Date(), parseISO(activeChallenge.started_at || new Date().toISOString()))
    );

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode("list")}
          >
            ← Back to Challenges
          </Button>
          {progress >= 100 && (
            <Button onClick={completeChallenge} className="bg-success hover:bg-success/90">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Challenge
            </Button>
          )}
        </div>

        {/* Challenge Info Card */}
        <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {activeChallenge.challenge.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeChallenge.challenge.description}
                </p>
              </div>
              <Badge className="bg-warning/20 text-warning">
                {activeChallenge.challenge.reward_points} pts
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Started {format(parseISO(activeChallenge.started_at || new Date().toISOString()), "MMM d")}
                </span>
                <span>{daysRemaining} days remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Check-in, Calendar, and Summary */}
        <Tabs defaultValue="checkin" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/80">
            <TabsTrigger value="checkin" className="gap-2">
              <Target className="w-4 h-4" />
              Check-In
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="mt-4 space-y-4">
            {/* Today's Check-ins Summary */}
            {todayCheckIns.length > 0 && (
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium">
                      {todayCheckIns.length} meal{todayCheckIns.length > 1 ? "s" : ""} logged today
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {todayCheckIns.map(c => (
                      <Badge key={c.id} variant="secondary" className="capitalize">
                        {c.meal_type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Anti-Cheat Notice */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Your entries are verified for authenticity. Photo uploads and detailed responses 
                improve your verification score and can earn you bonus points!
              </p>
            </div>

            {/* Check-in Form */}
            <ChallengeCheckInForm
              onSubmit={handleCheckIn}
              onUploadPhoto={uploadMealPhoto}
              todayMeals={todayCheckIns.map(c => c.meal_type)}
              dailyPrompt={dailyPrompt}
              onAnswerPrompt={answerDailyPrompt}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <ChallengeStreakCalendar
              streak={streak}
              calendarData={getCalendarData()}
              challengeStartDate={activeChallenge.started_at || undefined}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <ChallengeWeeklySummary
              checkIns={checkIns}
              challengeStartDate={activeChallenge.started_at || new Date().toISOString()}
              currentWeek={Math.ceil(differenceInDays(new Date(), parseISO(activeChallenge.started_at || new Date().toISOString())) / 7) || 1}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // List View
  const inProgressChallenges = userChallenges.filter(uc => uc.status === "in_progress");
  const completedChallenges = userChallenges.filter(uc => uc.status === "completed");
  const availableChallenges = challenges.filter(
    c => !userChallenges.find(uc => uc.challenge_id === c.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Challenges</h2>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline">{inProgressChallenges.length} Active</Badge>
          <Badge variant="secondary">{completedChallenges.length} Completed</Badge>
        </div>
      </div>

      {/* No challenges message */}
      {challenges.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-1">No Challenges Available</h3>
            <p className="text-sm text-muted-foreground">
              Check back soon for new challenges to participate in!
            </p>
          </CardContent>
        </Card>
      )}

      {/* In-Progress Challenge Cards */}
      {inProgressChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            Your Active Challenges
          </h3>
          {inProgressChallenges.map(userChallenge => (
            <Card 
              key={userChallenge.id} 
              className="shadow-soft border-primary cursor-pointer hover:shadow-medium transition-all"
              onClick={() => {
                setActiveChallenge(userChallenge);
                setViewMode("detail");
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary animate-pulse" />
                    <h3 className="font-semibold">{userChallenge.challenge.title}</h3>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <Progress value={getChallengeProgress(userChallenge)} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{Math.round(getChallengeProgress(userChallenge))}% complete</span>
                  <Button size="sm" variant="ghost" className="gap-1">
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Challenges */}
      {availableChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {inProgressChallenges.length > 0 ? "More Challenges to Try" : "Available Challenges"}
          </h3>
          {availableChallenges.map((challenge) => (
            <Card key={challenge.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{challenge.duration_days} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-warning" />
                        <span>{challenge.reward_points} points</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => startChallenge(challenge.id)}
                  size="sm"
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
          {completedChallenges.map(userChallenge => (
            <Card key={userChallenge.id} className="shadow-soft bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <h3 className="font-semibold">{userChallenge.challenge.title}</h3>
                  </div>
                  <Badge className="bg-success text-white">
                    +{userChallenge.challenge.reward_points} pts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
