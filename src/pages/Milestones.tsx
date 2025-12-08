import React from "react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, MapPin, Home, ChefHat, Trophy, Flame, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/BottomNav';
import { MilestoneCard } from '@/components/social/MilestoneCard';
import { RegionalRankBadge } from '@/components/social/RegionalRankBadge';
import { HouseholdScoreCard } from '@/components/social/HouseholdScoreCard';
import { RecipePoster } from '@/components/social/RecipePoster';
import { HonestyBadge } from '@/components/rewards/HonestyBadge';
import { useMilestones } from '@/hooks/useMilestones';
import { useHouseholdScore } from '@/hooks/useHouseholdScore';
import { useRegionalRanking } from '@/hooks/useRegionalRanking';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Milestones = () => {
  const navigate = useNavigate();
  const { userMilestones, isLoading: loadingMilestones } = useMilestones();
  const { data: householdScore } = useHouseholdScore();
  const { data: ranking } = useRegionalRanking();

  // Fetch recent generated recipes
  const { data: recentRecipes, isLoading: loadingRecipes } = useQuery({
    queryKey: ['recent-recipes-for-sharing'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('generated_recipe_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const groupedMilestones = userMilestones?.reduce((acc, um) => {
    const type = um.milestone?.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(um);
    return acc;
  }, {} as Record<string, typeof userMilestones>);

  const typeIcons: Record<string, React.ReactNode> = {
    streak: <Flame className="w-4 h-4" />,
    reduction: <TrendingDown className="w-4 h-4" />,
    challenge: <Trophy className="w-4 h-4" />,
    household: <Home className="w-4 h-4" />,
    region: <MapPin className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Milestones</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <HonestyBadge variant="compact" />
          </Card>
          {ranking ? (
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">Top {ranking.rankPercent}%</div>
              <p className="text-xs text-muted-foreground">Regional Rank</p>
            </Card>
          ) : (
            <Card className="p-3 text-center">
              <MapPin className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Set location</p>
            </Card>
          )}
          {householdScore ? (
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{householdScore.grade}</div>
              <p className="text-xs text-muted-foreground">Household</p>
            </Card>
          ) : (
            <Card className="p-3 text-center">
              <Home className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Start tracking</p>
            </Card>
          )}
        </div>

        <Tabs defaultValue="milestones" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="milestones">
              <Award className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="region">
              <MapPin className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="household">
              <Home className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="recipes">
              <ChefHat className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="mt-4 space-y-6">
            {loadingMilestones ? (
              <div className="space-y-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            ) : userMilestones && userMilestones.length > 0 ? (
              Object.entries(groupedMilestones || {}).map(([type, milestones]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    {typeIcons[type]}
                    <h3 className="font-semibold capitalize">{type} Milestones</h3>
                    <span className="text-xs text-muted-foreground">({milestones?.length})</span>
                  </div>
                  <div className="grid gap-4">
                    {milestones?.map((um) => (
                      <MilestoneCard
                        key={um.id}
                        title={um.milestone?.title || ''}
                        description={um.milestone?.description || ''}
                        type={um.milestone?.type || ''}
                        icon={um.milestone?.icon}
                        achievedAt={um.achieved_at}
                        meta={um.meta}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Milestones Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Keep tracking your oil usage to unlock achievements!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="region" className="mt-4">
            <h3 className="font-semibold mb-4">Regional Standing</h3>
            <RegionalRankBadge showShareButtons={true} />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Your ranking is based on oil reduction compared to others in your region.
              This celebrates improvement, not just low usage!
            </p>
          </TabsContent>

          <TabsContent value="household" className="mt-4">
            <h3 className="font-semibold mb-4">Family & Household</h3>
            <HouseholdScoreCard showShareButtons={true} />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Your household grade reflects your family's collective healthy oil habits.
            </p>
          </TabsContent>

          <TabsContent value="recipes" className="mt-4 space-y-4">
            <h3 className="font-semibold mb-4">Healthy Recipes to Share</h3>
            {loadingRecipes ? (
              <div className="space-y-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : recentRecipes && recentRecipes.length > 0 ? (
              recentRecipes.map((recipe) => {
                const output = recipe.recipe_output as any;
                return (
                  <RecipePoster
                    key={recipe.id}
                    title={output?.name || output?.title || 'AI Recipe'}
                    description={output?.description}
                    oilUsageMl={recipe.oil_estimate_ml}
                    prepTimeMinutes={output?.prep_time_minutes}
                    healthTags={output?.health_tags || output?.tags || []}
                    ingredients={
                      Array.isArray(output?.ingredients)
                        ? output.ingredients.map((i: any) => typeof i === 'string' ? i : i.name || i.item)
                        : []
                    }
                  />
                );
              })
            ) : (
              <Card className="p-8 text-center">
                <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Recipes Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Generate healthy recipes in Fit Meal to share them here!
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/fitmeal')}
                >
                  Go to Fit Meal
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Milestones;
