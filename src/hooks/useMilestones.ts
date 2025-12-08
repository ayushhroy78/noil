import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  type: string;
  icon: string | null;
  points_reward: number;
  threshold_value: number | null;
}

interface UserMilestone {
  id: string;
  user_id: string;
  milestone_id: string;
  achieved_at: string;
  meta: Record<string, any>;
  is_shared: boolean;
  milestone?: Milestone;
}

export const useMilestones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available milestones
  const { data: allMilestones, isLoading: loadingMilestones } = useQuery({
    queryKey: ["milestones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .order("type", { ascending: true });
      
      if (error) throw error;
      return data as Milestone[];
    },
  });

  // Fetch user's unlocked milestones
  const { data: userMilestones, isLoading: loadingUserMilestones } = useQuery({
    queryKey: ["user-milestones"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_milestones")
        .select(`
          *,
          milestone:milestones(*)
        `)
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false });
      
      if (error) throw error;
      return data as (UserMilestone & { milestone: Milestone })[];
    },
  });

  // Unlock a milestone
  const unlockMilestone = useMutation({
    mutationFn: async ({ 
      milestoneCode, 
      meta = {} 
    }: { 
      milestoneCode: string; 
      meta?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the milestone
      const milestone = allMilestones?.find(m => m.code === milestoneCode);
      if (!milestone) throw new Error("Milestone not found");

      // Check if already unlocked
      const existing = userMilestones?.find(um => um.milestone_id === milestone.id);
      if (existing) return null;

      const { data, error } = await supabase
        .from("user_milestones")
        .insert({
          user_id: user.id,
          milestone_id: milestone.id,
          meta,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { userMilestone: data, milestone };
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["user-milestones"] });
        toast({
          title: "🎉 New Milestone Unlocked!",
          description: result.milestone.title,
        });
      }
    },
  });

  // Mark milestone as shared
  const markAsShared = useMutation({
    mutationFn: async (userMilestoneId: string) => {
      const { error } = await supabase
        .from("user_milestones")
        .update({ is_shared: true })
        .eq("id", userMilestoneId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-milestones"] });
    },
  });

  return {
    allMilestones,
    userMilestones,
    isLoading: loadingMilestones || loadingUserMilestones,
    unlockMilestone,
    markAsShared,
  };
};
