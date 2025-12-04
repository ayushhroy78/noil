import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Droplets, TrendingUp, TrendingDown, Flame, Target, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface DailyLog {
  id: string;
  log_date: string;
  amount_ml: number;
  source: string | null;
}

interface HealthScore {
  score: number;
  score_date: string;
  total_oil_consumed: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayConsumption, setTodayConsumption] = useState(0);
  const [weeklyConsumption, setWeeklyConsumption] = useState(0);
  const [monthlyConsumption, setMonthlyConsumption] = useState(0);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState(25);
  const [weeklyData, setWeeklyData] = useState<{ day: string; consumption: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; consumption: number }[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  // Fetch all data
  const fetchDashboardData = async () => {
    if (!userId) return;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(today), 'yyyy-MM-dd');
    const monthStart = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');

    // Fetch today's consumption
    const { data: todayLogs } = await supabase
      .from('daily_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('log_date', todayStr);

    const todayTotal = todayLogs?.reduce((sum, log) => sum + Number(log.amount_ml), 0) || 0;
    setTodayConsumption(todayTotal);

    // Fetch weekly consumption
    const { data: weekLogs } = await supabase
      .from('daily_logs')
      .select('amount_ml, log_date')
      .eq('user_id', userId)
      .gte('log_date', weekStart);

    const weekTotal = weekLogs?.reduce((sum, log) => sum + Number(log.amount_ml), 0) || 0;
    setWeeklyConsumption(weekTotal);

    // Build weekly chart data
    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLogs = weekLogs?.filter(log => log.log_date === dateStr) || [];
      const dayTotal = dayLogs.reduce((sum, log) => sum + Number(log.amount_ml), 0);
      weeklyChartData.push({
        day: format(date, 'EEE'),
        consumption: dayTotal
      });
    }
    setWeeklyData(weeklyChartData);

    // Fetch monthly consumption
    const { data: monthLogs } = await supabase
      .from('daily_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .gte('log_date', monthStart);

    const monthTotal = monthLogs?.reduce((sum, log) => sum + Number(log.amount_ml), 0) || 0;
    setMonthlyConsumption(monthTotal);

    // Fetch latest health score
    const { data: scoreData } = await supabase
      .from('health_scores')
      .select('score')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })
      .limit(1);

    if (scoreData && scoreData.length > 0) {
      setHealthScore(scoreData[0].score);
    }

    // Generate mock hourly data for today
    const hourlyChartData = [];
    for (let i = 0; i < 24; i++) {
      hourlyChartData.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        consumption: i < new Date().getHours() ? Math.floor(Math.random() * 5) : 0
      });
    }
    setHourlyData(hourlyChartData);

    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_logs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchDashboardData();
          toast({
            title: "Data Updated",
            description: "Dashboard refreshed with latest data",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage <= 70) return "bg-green-500";
    if (percentage <= 100) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Real Time Dashboard</h1>
              <p className="text-xs text-muted-foreground">Live oil consumption metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Live Status Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium">Real-Time Tracking Active</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Last update: {format(lastUpdate, 'HH:mm:ss')}
            </div>
          </div>
        </div>

        {/* Health Score Card */}
        <Card className="bg-gradient-to-br from-card to-secondary/20 border-0 shadow-medium overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Health Score</p>
                <p className={`text-5xl font-bold ${getScoreColor(healthScore)}`}>
                  {healthScore}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-secondary"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(healthScore / 100) * 251.2} 251.2`}
                    className={getScoreColor(healthScore)}
                  />
                </svg>
                <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Progress */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold">{todayConsumption.toFixed(1)} ml</p>
                  <p className="text-sm text-muted-foreground">of {dailyGoal} ml daily goal</p>
                </div>
                <div className={`flex items-center gap-1 ${todayConsumption <= dailyGoal ? 'text-green-500' : 'text-red-500'}`}>
                  {todayConsumption <= dailyGoal ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {todayConsumption <= dailyGoal 
                      ? `${(dailyGoal - todayConsumption).toFixed(1)} ml left`
                      : `${(todayConsumption - dailyGoal).toFixed(1)} ml over`
                    }
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min((todayConsumption / dailyGoal) * 100, 100)} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">This Week</span>
              </div>
              <p className="text-2xl font-bold">{weeklyConsumption.toFixed(0)} ml</p>
              <p className="text-xs text-muted-foreground">
                Avg: {(weeklyConsumption / 7).toFixed(1)} ml/day
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">This Month</span>
              </div>
              <p className="text-2xl font-bold">{monthlyConsumption.toFixed(0)} ml</p>
              <p className="text-xs text-muted-foreground">
                ~{(monthlyConsumption / 30).toFixed(1)} ml/day
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Trend Chart */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} ml`, 'Consumption']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="consumption" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorConsumption)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal Line */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Daily Consumption Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData.slice(6, 22)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} ml`, 'Consumption']}
                  />
                  <Bar 
                    dataKey="consumption" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-0 shadow-soft bg-gradient-to-r from-success/10 to-success/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success/20 rounded-full">
                <Activity className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="font-medium text-sm">Quick Tip</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayConsumption < dailyGoal * 0.5 
                    ? "Great start! You're well within your daily limit. Keep it up!"
                    : todayConsumption < dailyGoal
                    ? "You're on track! Consider lighter cooking methods for remaining meals."
                    : "You've exceeded your daily goal. Try steaming or grilling for dinner."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
