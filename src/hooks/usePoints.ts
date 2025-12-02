import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
          .insert({ user_id: user.id, total_points: 0 })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPoints;
      }

      return data;
    },
  });

  const addPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentPoints = userPoints?.total_points || 0;
      const currentWeekPoints = userPoints?.points_this_week || 0;
      const currentMonthPoints = userPoints?.points_this_month || 0;

      const { data, error } = await supabase
        .from("user_points")
        .upsert({
          user_id: user.id,
          total_points: currentPoints + points,
          points_this_week: currentWeekPoints + points,
          points_this_month: currentMonthPoints + points,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, points) => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      toast({
        title: "Points Earned! 🎉",
        description: `You earned ${points} points!`,
      });
    },
  });

  return {
    userPoints,
    isLoading,
    addPoints: addPointsMutation.mutate,
  };
};
