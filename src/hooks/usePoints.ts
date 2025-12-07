import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddPointsParams {
  points: number;
  source: string;
  source_id?: string;
  description: string;
}

export const usePoints = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userPoints, isLoading } = useQuery({
    queryKey: ["user-points"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Initialize points if doesn't exist
      if (!data) {
        const { data: newPoints, error: insertError } = await supabase
          .from("user_points")
          .insert({ 
            user_id: user.id, 
            total_points: 0,
            lifetime_points_earned: 0,
            lifetime_points_spent: 0
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPoints;
      }

      return data;
    },
  });

  const addPointsMutation = useMutation({
    mutationFn: async ({ points, source, source_id, description }: AddPointsParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentPoints = userPoints?.total_points || 0;
      const currentWeekPoints = userPoints?.points_this_week || 0;
      const currentMonthPoints = userPoints?.points_this_month || 0;
      const currentLifetimeEarned = (userPoints as any)?.lifetime_points_earned || 0;

      const newBalance = currentPoints + points;

      // Update user points
      const { data, error } = await supabase
        .from("user_points")
        .upsert({
          user_id: user.id,
          total_points: newBalance,
          points_this_week: currentWeekPoints + points,
          points_this_month: currentMonthPoints + points,
          lifetime_points_earned: currentLifetimeEarned + points,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      // Record transaction
      const { error: txError } = await supabase
        .from("point_transactions")
        .insert({
          user_id: user.id,
          points,
          transaction_type: 'earned',
          source,
          source_id: source_id || null,
          description,
          balance_after: newBalance,
        });

      if (txError) console.error("Transaction logging failed:", txError);

      return { data, points };
    },
    onSuccess: ({ points }) => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      queryClient.invalidateQueries({ queryKey: ["point-transactions"] });
      toast({
        title: "Points Earned! 🎉",
        description: `You earned ${points} points!`,
      });
    },
  });

  // Legacy addPoints for backward compatibility
  const addPoints = (points: number) => {
    addPointsMutation.mutate({
      points,
      source: 'achievement',
      description: `Earned ${points} points`,
    });
  };

  // New addPointsWithDetails for full tracking
  const addPointsWithDetails = (params: AddPointsParams) => {
    addPointsMutation.mutate(params);
  };

  return {
    userPoints,
    isLoading,
    addPoints,
    addPointsWithDetails,
  };
};
