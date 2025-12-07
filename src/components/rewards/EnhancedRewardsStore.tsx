import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePoints } from "@/hooks/usePoints";
import { usePointTransactions } from "@/hooks/usePointTransactions";
import { PointsDashboard } from "./PointsDashboard";
import { TransactionHistory } from "./TransactionHistory";
import { 
  Gift, 
  Tag, 
  Sparkles, 
  BookOpen, 
  Ticket, 
  Check, 
  ShoppingBag, 
  PartyPopper,
  LayoutDashboard,
  History,
  Store
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
// @ts-ignore - canvas-confetti types may be loaded async
import confetti from "canvas-confetti";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  reward_value: string;
  image_url: string | null;
  stock_quantity: number | null;
}

interface UserReward {
  id: string;
  reward_id: string;
  redeemed_at: string;
  redemption_code: string | null;
  is_used: boolean;
  expires_at: string | null;
  rewards: Reward;
}

export const EnhancedRewardsStore = ({ userId }: { userId: string | null }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userPoints } = usePoints();
  const { addTransaction } = usePointTransactions();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .order("points_cost", { ascending: true });

      if (error) throw error;
      return data as Reward[];
    },
  });

  const { data: userRewards } = useQuery({
    queryKey: ["user-rewards", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_rewards")
        .select("*, rewards(*)")
        .eq("user_id", userId)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;
      return data as UserReward[];
    },
    enabled: !!userId,
  });

  const handleRedeem = async (reward: Reward) => {
    if (!userId) return;
    setIsRedeeming(true);

    try {
      const currentPoints = userPoints?.total_points || 0;
      if (currentPoints < reward.points_cost) {
        throw new Error("Not enough points");
      }

      // Generate redemption code
      const code = `NOIL-${reward.reward_type.toUpperCase().slice(0, 3)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      const newBalance = currentPoints - reward.points_cost;

      // Insert user reward
      const { error: rewardError } = await supabase
        .from("user_rewards")
        .insert({
          user_id: userId,
          reward_id: reward.id,
          redemption_code: code,
          expires_at: expiresAt.toISOString(),
        });

      if (rewardError) throw rewardError;

      // Deduct points
      const { error: pointsError } = await supabase
        .from("user_points")
        .update({ total_points: newBalance })
        .eq("user_id", userId);

      if (pointsError) throw pointsError;

      // Record transaction
      addTransaction({
        points: reward.points_cost,
        transaction_type: 'spent',
        source: 'reward_redemption',
        source_id: reward.id,
        description: `Redeemed: ${reward.name}`,
        balance_after: newBalance,
      });

      setRedeemedCode(code);
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      queryClient.invalidateQueries({ queryKey: ["user-rewards"] });

      // Celebration animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "Reward Redeemed! 🎉",
        description: "Check your rewards for the redemption code",
      });
    } catch (error: any) {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "discount":
        return <Tag className="h-5 w-5 text-green-500" />;
      case "premium_feature":
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case "wellness_content":
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      default:
        return <Gift className="h-5 w-5 text-primary" />;
    }
  };

  const getRewardTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      discount: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      premium_feature: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      wellness_content: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    const labels: Record<string, string> = {
      discount: "Discount",
      premium_feature: "Premium",
      wellness_content: "Content",
    };
    return (
      <Badge className={colors[type] || "bg-muted"}>
        {labels[type] || type}
      </Badge>
    );
  };

  if (!userId) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Sign in to access the Rewards Store</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-1.5 text-xs">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <PointsDashboard />
        </TabsContent>

        <TabsContent value="store" className="mt-0 space-y-6">
          {/* My Rewards */}
          {userRewards && userRewards.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                My Rewards
              </h3>
              <div className="space-y-3">
                {userRewards.slice(0, 3).map((ur) => (
                  <Card key={ur.id} className="bg-muted/30">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getRewardIcon(ur.rewards.reward_type)}
                          <div>
                            <p className="font-medium text-sm">{ur.rewards.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{ur.redemption_code}</p>
                          </div>
                        </div>
                        {ur.is_used ? (
                          <Badge variant="secondary" className="text-xs">Used</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Active</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Available Rewards */}
          {loadingRewards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Available Rewards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards?.map((reward) => {
                  const canAfford = (userPoints?.total_points || 0) >= reward.points_cost;
                  const isOutOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;

                  return (
                    <Card
                      key={reward.id}
                      className={cn(
                        "transition-all duration-300",
                        canAfford && !isOutOfStock 
                          ? "hover:shadow-lg hover:scale-[1.02] cursor-pointer" 
                          : "opacity-60"
                      )}
                      onClick={() => canAfford && !isOutOfStock && setSelectedReward(reward)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getRewardIcon(reward.reward_type)}
                            <CardTitle className="text-base">{reward.name}</CardTitle>
                          </div>
                          {getRewardTypeBadge(reward.reward_type)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="font-bold text-amber-600">{reward.points_cost}</span>
                            <span className="text-xs text-muted-foreground">points</span>
                          </div>
                          {isOutOfStock ? (
                            <Badge variant="secondary">Out of Stock</Badge>
                          ) : !canAfford ? (
                            <Badge variant="outline" className="text-xs">
                              Need {reward.points_cost - (userPoints?.total_points || 0)} more
                            </Badge>
                          ) : (
                            <Button size="sm" variant="default" className="h-7 text-xs gap-1">
                              <Gift className="w-3 h-3" />
                              Redeem
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <TransactionHistory />
        </TabsContent>
      </Tabs>

      {/* Redeem Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => { setSelectedReward(null); setRedeemedCode(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReward && getRewardIcon(selectedReward.reward_type)}
              {redeemedCode ? "Reward Redeemed!" : "Confirm Redemption"}
            </DialogTitle>
            <DialogDescription>
              {redeemedCode
                ? "Your reward has been successfully redeemed!"
                : `You are about to redeem ${selectedReward?.name} for ${selectedReward?.points_cost} points.`}
            </DialogDescription>
          </DialogHeader>

          {redeemedCode ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-6 text-center">
                <div className="relative">
                  <PartyPopper className="h-16 w-16 text-emerald-500 mx-auto mb-3 animate-bounce" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">Your redemption code:</p>
                <p className="text-2xl font-mono font-bold text-emerald-600 tracking-wider">{redeemedCode}</p>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                This code is valid for 3 months. Use it at checkout or show it to claim your reward.
              </p>
              <Button className="w-full" onClick={() => { setSelectedReward(null); setRedeemedCode(null); }}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    {selectedReward && getRewardIcon(selectedReward.reward_type)}
                    <div>
                      <p className="font-medium">{selectedReward?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedReward?.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <span>Your balance:</span>
                  <span className="font-bold">{userPoints?.total_points || 0} points</span>
                </div>
                <div className="flex items-center justify-between text-sm text-rose-600">
                  <span>Cost:</span>
                  <span className="font-bold">-{selectedReward?.points_cost} points</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between text-sm">
                  <span className="font-medium">After redemption:</span>
                  <span className="font-bold text-primary">
                    {(userPoints?.total_points || 0) - (selectedReward?.points_cost || 0)} points
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedReward(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => selectedReward && handleRedeem(selectedReward)}
                  disabled={isRedeeming}
                >
                  {isRedeeming ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
