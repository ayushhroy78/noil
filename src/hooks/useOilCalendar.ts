import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, subMonths, differenceInDays, isSameDay, parseISO } from "date-fns";

export interface DayData {
  date: Date;
  amount_ml: number;
  hasData: boolean;
  notes?: string;
}

export interface CalendarStats {
  daysTracked: number;
  dailyAverage: number;
  totalThisMonth: number;
  trackingStreak: number;
  bestDay: { date: Date; amount: number } | null;
  comparisonWithLastMonth: number;
  daysInMonth: number;
}

export const useOilCalendar = (userId: string | null) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyGoal, setDailyGoal] = useState(25); // Default 25ml daily goal

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const prevMonthStart = startOfMonth(subMonths(currentMonth, 1));
  const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));

  const { data: currentMonthLogs, isLoading, refetch } = useQuery({
    queryKey: ["oil-calendar", userId, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", format(monthStart, "yyyy-MM-dd"))
        .lte("log_date", format(monthEnd, "yyyy-MM-dd"))
        .order("log_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: prevMonthLogs } = useQuery({
    queryKey: ["oil-calendar-prev", userId, format(subMonths(currentMonth, 1), "yyyy-MM")],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", format(prevMonthStart, "yyyy-MM-dd"))
        .lte("log_date", format(prevMonthEnd, "yyyy-MM-dd"));

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: allLogs } = useQuery({
    queryKey: ["oil-calendar-streak", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("daily_logs")
        .select("log_date, amount_ml")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(60);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const stats: CalendarStats = useMemo(() => {
    const logs = currentMonthLogs || [];
    const prevLogs = prevMonthLogs || [];
    const allLogsData = allLogs || [];

    // Group logs by date and sum amounts
    const dailyTotals = new Map<string, number>();
    logs.forEach((log) => {
      const dateKey = log.log_date;
      dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + Number(log.amount_ml));
    });

    const daysTracked = dailyTotals.size;
    const totalThisMonth = logs.reduce((sum, log) => sum + Number(log.amount_ml), 0);
    const dailyAverage = daysTracked > 0 ? Math.round(totalThisMonth / daysTracked) : 0;

    // Previous month total
    const prevMonthTotal = prevLogs.reduce((sum, log) => sum + Number(log.amount_ml), 0);
    const comparisonWithLastMonth = prevMonthTotal > 0 
      ? Math.round(((totalThisMonth - prevMonthTotal) / prevMonthTotal) * 100)
      : 0;

    // Best day (lowest consumption)
    let bestDay: { date: Date; amount: number } | null = null;
    dailyTotals.forEach((amount, dateStr) => {
      if (!bestDay || amount < bestDay.amount) {
        bestDay = { date: parseISO(dateStr), amount };
      }
    });

    // Calculate streak
    let trackingStreak = 0;
    const today = new Date();
    const sortedDates = Array.from(new Set(allLogsData.map(l => l.log_date))).sort().reverse();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const logDate = parseISO(sortedDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      logDate.setHours(0, 0, 0, 0);
      
      if (isSameDay(logDate, expectedDate)) {
        trackingStreak++;
      } else {
        break;
      }
    }

    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

    return {
      daysTracked,
      dailyAverage,
      totalThisMonth,
      trackingStreak,
      bestDay,
      comparisonWithLastMonth,
      daysInMonth,
    };
  }, [currentMonthLogs, prevMonthLogs, allLogs, monthEnd, monthStart]);

  const getDayData = (date: Date): DayData => {
    const logs = currentMonthLogs || [];
    const dateStr = format(date, "yyyy-MM-dd");
    const dayLogs = logs.filter(log => log.log_date === dateStr);
    const amount_ml = dayLogs.reduce((sum, log) => sum + Number(log.amount_ml), 0);
    const notes = dayLogs.map(l => l.notes).filter(Boolean).join(", ");

    return {
      date,
      amount_ml,
      hasData: dayLogs.length > 0,
      notes: notes || undefined,
    };
  };

  const getConsumptionLevel = (amount: number): "optimal" | "moderate" | "high" | "none" => {
    if (amount === 0) return "none";
    if (amount <= dailyGoal * 0.8) return "optimal";
    if (amount <= dailyGoal * 1.2) return "moderate";
    return "high";
  };

  const goToPrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return {
    currentMonth,
    stats,
    isLoading,
    getDayData,
    getConsumptionLevel,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    dailyGoal,
    setDailyGoal,
    refetch,
  };
};
