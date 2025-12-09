import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  transaction_type: 'earned' | 'spent';
  source: string;
  source_id: string | null;
  description: string;
  balance_after: number;
  created_at: string;
}

export interface PointBreakdown {
  source: string;
  total: number;
  count: number;
}

export const usePointTransactions = (limit: number = 100) => {
  const queryClient = useQueryClient();

  // Fetch transactions with pagination and specific columns
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["point-transactions", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Optimized: specific columns, limit, proper indexing
      const { data, error } = await supabase
        .from("point_transactions")
        .select("id, points, transaction_type, source, source_id, description, balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PointTransaction[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });

  // Calculate breakdown by source
  const earnedBreakdown: PointBreakdown[] = transactions
    ?.filter(t => t.transaction_type === 'earned')
    .reduce((acc, t) => {
      const existing = acc.find(b => b.source === t.source);
      if (existing) {
        existing.total += t.points;
        existing.count += 1;
      } else {
        acc.push({ source: t.source, total: t.points, count: 1 });
      }
      return acc;
    }, [] as PointBreakdown[]) || [];

  const spentBreakdown: PointBreakdown[] = transactions
    ?.filter(t => t.transaction_type === 'spent')
    .reduce((acc, t) => {
      const existing = acc.find(b => b.source === t.source);
      if (existing) {
        existing.total += Math.abs(t.points);
        existing.count += 1;
      } else {
        acc.push({ source: t.source, total: Math.abs(t.points), count: 1 });
      }
      return acc;
    }, [] as PointBreakdown[]) || [];

  // Calculate totals
  const totalEarned = transactions
    ?.filter(t => t.transaction_type === 'earned')
    .reduce((sum, t) => sum + t.points, 0) || 0;

  const totalSpent = transactions
    ?.filter(t => t.transaction_type === 'spent')
    .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async ({
      points,
      transaction_type,
      source,
      source_id,
      description,
      balance_after,
    }: Omit<PointTransaction, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("point_transactions")
        .insert({
          user_id: user.id,
          points,
          transaction_type,
          source,
          source_id,
          description,
          balance_after,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["point-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
    },
  });

  // Recent transactions (last 10)
  const recentTransactions = transactions?.slice(0, 10) || [];

  return {
    transactions,
    recentTransactions,
    earnedBreakdown,
    spentBreakdown,
    totalEarned,
    totalSpent,
    isLoading,
    addTransaction: addTransactionMutation.mutate,
  };
};
