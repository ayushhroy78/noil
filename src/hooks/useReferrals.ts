import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePoints } from "@/hooks/usePoints";

const REFERRAL_REWARD_POINTS = 100;

export const useReferrals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addPoints } = usePoints();

  // Get current user's profile with referral code
  const { data: userProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["user-profile-referral"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("referral_code, referred_by")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Get referrals made by current user - optimized with specific columns and limit
  const { data: myReferrals, isLoading: loadingReferrals } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("referrals")
        .select("id, referred_id, referral_code, status, referrer_rewarded, created_at, completed_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100); // Limit for scalability

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Apply referral code during signup
  const applyReferralMutation = useMutation({
    mutationFn: async (referralCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the referrer by code
      const { data: referrer, error: referrerError } = await supabase
        .from("user_profiles")
        .select("user_id, referral_code")
        .eq("referral_code", referralCode.toUpperCase())
        .maybeSingle();

      if (referrerError) throw referrerError;
      if (!referrer) throw new Error("Invalid referral code");
      if (referrer.user_id === user.id) throw new Error("You cannot use your own referral code");

      // Check if user was already referred
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("id")
        .eq("referred_id", user.id)
        .maybeSingle();

      if (existingReferral) throw new Error("You have already used a referral code");

      // Create the referral record
      const { error: insertError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referrer.user_id,
          referred_id: user.id,
          referral_code: referralCode.toUpperCase(),
          status: "completed",
          completed_at: new Date().toISOString(),
          referrer_rewarded: true,
          referred_rewarded: true,
        });

      if (insertError) throw insertError;

      // Update user profile with referred_by
      await supabase
        .from("user_profiles")
        .update({ referred_by: referrer.user_id })
        .eq("user_id", user.id);

      // Award points to the referrer as well
      const referrerCurrentPoints = await supabase
        .from("user_points")
        .select("total_points, points_this_week, points_this_month, lifetime_points_earned")
        .eq("user_id", referrer.user_id)
        .maybeSingle();
      
      if (referrerCurrentPoints.data) {
        await supabase
          .from("user_points")
          .upsert({
            user_id: referrer.user_id,
            total_points: (referrerCurrentPoints.data.total_points || 0) + REFERRAL_REWARD_POINTS,
            points_this_week: (referrerCurrentPoints.data.points_this_week || 0) + REFERRAL_REWARD_POINTS,
            points_this_month: (referrerCurrentPoints.data.points_this_month || 0) + REFERRAL_REWARD_POINTS,
            lifetime_points_earned: (referrerCurrentPoints.data.lifetime_points_earned || 0) + REFERRAL_REWARD_POINTS,
          }, { onConflict: 'user_id' });

        // Log the transaction for referrer
        await supabase
          .from("point_transactions")
          .insert({
            user_id: referrer.user_id,
            points: REFERRAL_REWARD_POINTS,
            transaction_type: 'earned',
            source: 'referral',
            description: 'Earned points for successful referral',
            balance_after: (referrerCurrentPoints.data.total_points || 0) + REFERRAL_REWARD_POINTS,
          });
      }

      return { referrerId: referrer.user_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-referrals"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile-referral"] });
      
      // Award points to the new user
      addPoints(REFERRAL_REWARD_POINTS);
      
      toast({
        title: "Referral Applied! 🎉",
        description: `You earned ${REFERRAL_REWARD_POINTS} points for using a referral code!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Referral Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get referral stats
  const referralStats = {
    totalReferrals: myReferrals?.length || 0,
    completedReferrals: myReferrals?.filter(r => r.status === "completed").length || 0,
    pendingReferrals: myReferrals?.filter(r => r.status === "pending").length || 0,
    totalEarned: (myReferrals?.filter(r => r.referrer_rewarded).length || 0) * REFERRAL_REWARD_POINTS,
  };

  return {
    userProfile,
    myReferrals,
    referralStats,
    isLoading: loadingProfile || loadingReferrals,
    applyReferral: applyReferralMutation.mutate,
    isApplying: applyReferralMutation.isPending,
    REFERRAL_REWARD_POINTS,
  };
};
