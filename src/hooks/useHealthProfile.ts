import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HealthProfile {
  full_name: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: string | null;
  activity_level: string | null;
  health_conditions: string[] | null;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: string | null;
  activity_level: string | null;
  daily_oil_goal_ml: number | null;
  relationship: string | null;
  created_at: string;
  updated_at: string;
}

// Calculate recommended daily oil intake based on health metrics
export const calculateRecommendedOil = (
  weight_kg: number | null,
  activity_level: string | null,
  age: number | null
): number => {
  // Base recommendation: 0.5ml per kg of body weight
  const baseWeight = weight_kg || 60;
  let baseOil = baseWeight * 0.35;

  // Adjust for activity level
  const activityMultiplier: Record<string, number> = {
    sedentary: 0.8,
    light: 0.9,
    moderate: 1.0,
    active: 1.1,
    very_active: 1.2,
  };
  baseOil *= activityMultiplier[activity_level || "moderate"] || 1.0;

  // Adjust for age (older adults need less)
  if (age) {
    if (age > 60) baseOil *= 0.85;
    else if (age > 50) baseOil *= 0.9;
    else if (age < 18) baseOil *= 0.8;
  }

  // ICMR recommends 20-30ml per day, cap at reasonable limits
  return Math.max(15, Math.min(35, Math.round(baseOil)));
};

export const useHealthProfile = (userId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["health-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("full_name, age, weight_kg, height_cm, gender, activity_level, health_conditions")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as HealthProfile | null;
    },
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<HealthProfile>) => {
      if (!userId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-profile", userId] });
      toast({
        title: "Profile Updated",
        description: "Your health profile has been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  return {
    profile,
    profileLoading,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
  };
};

export const useFamilyMembers = (userId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ["family-members", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FamilyMember[];
    },
    enabled: !!userId,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: Omit<FamilyMember, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!userId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("family_members")
        .insert({ ...member, user_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", userId] });
      toast({
        title: "Member Added",
        description: "Family member has been added",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add family member",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FamilyMember> & { id: string }) => {
      const { error } = await supabase
        .from("family_members")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", userId] });
      toast({
        title: "Member Updated",
        description: "Family member has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update family member",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", userId] });
      toast({
        title: "Member Removed",
        description: "Family member has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove family member",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  return {
    familyMembers: familyMembers || [],
    isLoading,
    addMember: addMemberMutation.mutate,
    updateMember: updateMemberMutation.mutate,
    deleteMember: deleteMemberMutation.mutate,
    isAdding: addMemberMutation.isPending,
    isUpdating: updateMemberMutation.isPending,
  };
};
