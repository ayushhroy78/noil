import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePoints } from "@/hooks/usePoints";
import { useAchievements } from "@/hooks/useAchievements";
import { RewardsStore } from "@/components/discover/RewardsStore";
import { ReferralSection } from "@/components/discover/ReferralSection";
import { BadgesSection } from "@/components/discover/BadgesSection";
import { ChallengesTab } from "@/components/discover/ChallengesTab";
import { OilConsumptionCalendar } from "@/components/profile/OilConsumptionCalendar";
import { HealthProfileForm } from "@/components/profile/HealthProfileForm";
import { FamilyMembersManager } from "@/components/profile/FamilyMembersManager";
import {
  ArrowLeft,
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
} from "lucide-react";
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
  
  const defaultTab = searchParams.get("tab") || "health";

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
        
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile && (profile as any).role) {
          setUserRole((profile as any).role);
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
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Profile</h1>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          {userRole === "admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
              data-testid="button-admin"
            >
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Button>
          )}
        </div>
      </header>

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
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="health" className="text-xs px-1" data-testid="tab-health">
              <Heart className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="family" className="text-xs px-1" data-testid="tab-family">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs px-1" data-testid="tab-calendar">
              <CalendarDays className="w-4 h-4" />
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

          <TabsContent value="family">
            <FamilyMembersManager userId={userId} />
          </TabsContent>

          <TabsContent value="calendar">
            <OilConsumptionCalendar userId={userId} />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsStore userId={userId} />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesTab userId={userId} />
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
