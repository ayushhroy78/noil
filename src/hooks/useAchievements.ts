import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePoints } from "./usePoints";

export const useAchievements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addPoints } = usePoints();

  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("badge_tier", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: userAchievements } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
  });

  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_id: achievementId })
        .select("*, achievements(*)")
        .single();

      if (error) {
        if (error.code === "23505") {
          // Already unlocked
          return null;
        }
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
        const achievement = data.achievements as any;
        addPoints(achievement.points_reward);
        toast({
          title: `Achievement Unlocked! ${achievement.icon}`,
          description: achievement.title,
        });
      }
    },
  });

  const checkAndUnlockAchievements = async (milestoneType: string, currentValue: number) => {
    const relevantAchievements = achievements?.filter(
      (a) => a.milestone_type === milestoneType && a.milestone_value <= currentValue
    );

    const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);

    for (const achievement of relevantAchievements || []) {
      if (!unlockedIds.has(achievement.id)) {
        unlockAchievementMutation.mutate(achievement.id);
      }
    }
  };

  return {
    achievements,
    userAchievements,
    unlockAchievement: unlockAchievementMutation.mutate,
    checkAndUnlockAchievements,
  };
};
