import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useReferrals } from "@/hooks/useReferrals";
import { Gift, Copy, Users, Trophy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralSectionProps {
  userId: string | null;
}

export const ReferralSection = ({ userId }: ReferralSectionProps) => {
  const { toast } = useToast();
  const { userProfile, referralStats, isLoading, applyReferral, isApplying, REFERRAL_REWARD_POINTS } = useReferrals();
  const [referralInput, setReferralInput] = useState("");

  const copyReferralCode = () => {
    if (userProfile?.referral_code) {
      navigator.clipboard.writeText(userProfile.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const shareReferralCode = async () => {
    if (userProfile?.referral_code && navigator.share) {
      try {
        await navigator.share({
          title: "Join Noil!",
          text: `Use my referral code ${userProfile.referral_code} to sign up and earn ${REFERRAL_REWARD_POINTS} bonus points!`,
          url: window.location.origin,
        });
      } catch (error) {
        copyReferralCode();
      }
    } else {
      copyReferralCode();
    }
  };

  const handleApplyReferral = () => {
    if (referralInput.trim()) {
      applyReferral(referralInput.trim());
      setReferralInput("");
    }
  };

  if (!userId) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-8 text-center">
          <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Please log in to access referral rewards</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Your Referral Code */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-background rounded-lg px-4 py-3 font-mono text-xl font-bold text-primary text-center border-2 border-primary/30">
              {userProfile?.referral_code || "---"}
            </div>
            <Button variant="outline" size="icon" onClick={copyReferralCode}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={shareReferralCode}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Share this code and earn <span className="font-semibold text-primary">{REFERRAL_REWARD_POINTS} points</span> for each friend who joins!
          </p>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <Users className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{referralStats.totalReferrals}</p>
          <p className="text-xs text-muted-foreground">Total Referrals</p>
        </Card>
        <Card className="text-center py-4">
          <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{referralStats.completedReferrals}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
        <Card className="text-center py-4">
          <Gift className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{referralStats.totalEarned}</p>
          <p className="text-xs text-muted-foreground">Points Earned</p>
        </Card>
      </div>

      {/* Apply Referral Code (if not already referred) */}
      {!userProfile?.referred_by && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Have a Referral Code?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                maxLength={8}
              />
              <Button 
                onClick={handleApplyReferral} 
                disabled={!referralInput.trim() || isApplying}
              >
                {isApplying ? "Applying..." : "Apply"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Apply a friend's code to earn {REFERRAL_REWARD_POINTS} bonus points!
            </p>
          </CardContent>
        </Card>
      )}

      {userProfile?.referred_by && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="py-4 text-center">
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
              ✓ Referral Applied
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              You've already used a referral code and earned your bonus points!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
