import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePoints } from "@/hooks/usePoints";
import { useAchievements } from "@/hooks/useAchievements";
import { EnhancedRewardsStore } from "@/components/rewards/EnhancedRewardsStore";
import { ReferralSection } from "@/components/discover/ReferralSection";
import { BadgesSection } from "@/components/discover/BadgesSection";
import { EnhancedChallengesTab } from "@/components/discover/EnhancedChallengesTab";
import { OilConsumptionCalendar } from "@/components/profile/OilConsumptionCalendar";
import { HealthProfileForm } from "@/components/profile/HealthProfileForm";
import { FamilyMembersManager } from "@/components/profile/FamilyMembersManager";
import { AIConsumptionAudit } from "@/components/profile/AIConsumptionAudit";
import {
  User,
  Gift,
  Trophy,
  Settings,
  LogOut,
  Store,
  Sparkles,
  Medal,
  Share2,
  ChevronRight,
  Shield,
  CalendarDays,
  Heart,
  Users,
  Brain,
  Award,
} from "lucide-react";
import { useMilestones } from "@/hooks/useMilestones";
import { MilestoneCard } from "@/components/social/MilestoneCard";
import { HonestyBadge } from "@/components/rewards/HonestyBadge";
import { RegionalRankBadge } from "@/components/social/RegionalRankBadge";
import { HouseholdScoreCard } from "@/components/social/HouseholdScoreCard";
import { useHouseholdScore } from "@/hooks/useHouseholdScore";
import { useRegionalRanking } from "@/hooks/useRegionalRanking";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);
  const { userPoints, isLoading: pointsLoading } = usePoints();
  const { userAchievements } = useAchievements();
  const { userMilestones, isLoading: milestonesLoading } = useMilestones();
  const { data: householdScore } = useHouseholdScore();
  const { data: ranking } = useRegionalRanking();
  
  const defaultTab = searchParams.get("tab") || "health";

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
        
        // Check role from secure user_roles table
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (roleData?.role) {
          setUserRole(roleData.role);
        }
      } else {
        navigate("/auth");
      }
      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopNav title="Profile" subtitle={userEmail || undefined} showBackButton />
      
      {/* Admin Button - shown below TopNav for admins */}
      {userRole === "admin" && (
        <div className="px-4 py-2 bg-card border-b border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin")}
            data-testid="button-admin"
            className="w-full"
          >
            <Shield className="w-4 h-4 mr-1" />
            Admin Panel
          </Button>
        </div>
      )}

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" data-testid="text-user-email">{userEmail}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {pointsLoading ? "..." : userPoints?.total_points || 0} Points
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Medal className="w-3 h-3 mr-1" />
                    {userAchievements?.length || 0} Badges
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-6">
            <TabsTrigger value="health" className="text-xs px-1" data-testid="tab-health">
              <Heart className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs px-1" data-testid="tab-audit">
              <Brain className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="family" className="text-xs px-1" data-testid="tab-family">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs px-1" data-testid="tab-calendar">
              <CalendarDays className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs px-1" data-testid="tab-milestones">
              <Award className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs px-1" data-testid="tab-rewards">
              <Gift className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs px-1" data-testid="tab-challenges">
              <Trophy className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="referral" className="text-xs px-1" data-testid="tab-referral">
              <Share2 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs px-1" data-testid="tab-settings">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <HealthProfileForm userId={userId} />
          </TabsContent>

          <TabsContent value="audit">
            <AIConsumptionAudit userId={userId} />
          </TabsContent>

          <TabsContent value="family">
            <FamilyMembersManager userId={userId} />
          </TabsContent>

          <TabsContent value="calendar">
            <OilConsumptionCalendar userId={userId} />
          </TabsContent>

          <TabsContent value="milestones">
            <div className="space-y-6">
              {/* Summary Row */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <HonestyBadge />
                {ranking && (
                  <Badge variant="outline" className="shrink-0">
                    Top {ranking.rankPercent}% in {ranking.regionLabel}
                  </Badge>
                )}
                {householdScore && (
                  <Badge variant="outline" className="shrink-0">
                    Household: {householdScore.grade}
                  </Badge>
                )}
              </div>

              {/* Milestones Grid */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Milestones</h3>
                {milestonesLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                  </div>
                ) : userMilestones && userMilestones.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {userMilestones.map((um) => (
                      <MilestoneCard
                        key={um.id}
                        title={um.milestone?.title || "Milestone"}
                        description={um.milestone?.description || ""}
                        type={um.milestone?.type || "streak"}
                        icon={um.milestone?.icon}
                        achievedAt={um.achieved_at}
                        meta={um.meta as Record<string, any> || {}}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Complete challenges and track consistently to unlock milestones!
                    </p>
                  </Card>
                )}
              </div>

              {/* Regional Ranking */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Regional Ranking</h3>
                <RegionalRankBadge />
              </div>

              {/* Household Score */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Household Score</h3>
                <HouseholdScoreCard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards">
            <EnhancedRewardsStore userId={userId} />
          </TabsContent>

          <TabsContent value="challenges">
            <EnhancedChallengesTab userId={userId} />
          </TabsContent>

          <TabsContent value="referral">
            <div className="space-y-4">
              <ReferralSection userId={userId} />
              <BadgesSection />
            </div>
          </TabsContent>


          <TabsContent value="settings">
            <div className="space-y-4">
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate("/restaurant-apply")}
                data-testid="card-restaurant-apply"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Register Your Restaurant</p>
                        <p className="text-xs text-muted-foreground">
                          Apply to be listed as a healthy restaurant
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Email</span>
                    <span className="text-sm text-muted-foreground">{userEmail}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Account Type</span>
                    <Badge variant="secondary" className="capitalize">{userRole}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Total Points Earned</span>
                    <span className="text-sm font-medium">{userPoints?.total_points || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
