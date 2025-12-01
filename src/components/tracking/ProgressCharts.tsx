import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

interface ProgressChartsProps {
  userId: string;
}

export const ProgressCharts = ({ userId }: ProgressChartsProps) => {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [userId]);

  const fetchChartData = async () => {
    try {
      const now = new Date();
      const weekAgo = subDays(now, 7);
      const sixMonthsAgo = subMonths(now, 6);

      // Fetch logs
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", sixMonthsAgo.toISOString());

      // Fetch scans
      const { data: scans } = await supabase
        .from("barcode_scans")
        .select("*")
        .eq("user_id", userId)
        .gte("scan_date", sixMonthsAgo.toISOString());

      // Process weekly data (last 7 days)
      const weekDays = eachDayOfInterval({ start: weekAgo, end: now });
      const weeklyChartData = weekDays.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLogs = logs?.filter(
          (log) => format(new Date(log.log_date), "yyyy-MM-dd") === dayStr
        ) || [];
        const dayScans = scans?.filter(
          (scan) => format(new Date(scan.scan_date), "yyyy-MM-dd") === dayStr
        ) || [];

        const cookingOil = dayLogs
          .filter((log) => log.source === "manual")
          .reduce((sum, log) => sum + Number(log.amount_ml), 0);
        const hiddenOil = dayScans.reduce(
          (sum, scan) => sum + Number(scan.oil_content_ml), 0
        );

        return {
          date: format(day, "EEE"),
          cookingOil: Math.round(cookingOil),
          hiddenOil: Math.round(hiddenOil),
          total: Math.round(cookingOil + hiddenOil),
        };
      });

      // Process monthly data (last 6 months)
      const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
      const monthlyChartData = months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthLogs = logs?.filter(
          (log) =>
            format(new Date(log.log_date), "yyyy-MM") ===
            format(monthStart, "yyyy-MM")
        ) || [];
        const monthScans = scans?.filter(
          (scan) =>
            format(new Date(scan.scan_date), "yyyy-MM") ===
            format(monthStart, "yyyy-MM")
        ) || [];

        const cookingOil = monthLogs
          .filter((log) => log.source === "manual")
          .reduce((sum, log) => sum + Number(log.amount_ml), 0);
        const hiddenOil = monthScans.reduce(
          (sum, scan) => sum + Number(scan.oil_content_ml), 0
        );

        return {
          date: format(month, "MMM"),
          cookingOil: Math.round(cookingOil),
          hiddenOil: Math.round(hiddenOil),
          total: Math.round(cookingOil + hiddenOil),
        };
      });

      setWeeklyData(weeklyChartData);
      setMonthlyData(monthlyChartData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/40 shadow-soft">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Progress Charts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Last 7 Days Oil Consumption
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="cookingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="hiddenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 13, fontWeight: 600, fontFamily: "system-ui" }}
                    axisLine={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    tickLine={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5 }}
                    tickMargin={10}
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 13, fontWeight: 600, fontFamily: "system-ui" }}
                    axisLine={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    tickLine={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5 }}
                    tickMargin={10}
                    width={60}
                    label={{ 
                      value: "Oil (ml)", 
                      angle: -90, 
                      position: "insideLeft", 
                      style: { 
                        fill: "hsl(var(--primary))", 
                        fontSize: 14, 
                        fontWeight: 700,
                        fontFamily: "system-ui"
                      } 
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "2px solid hsl(var(--primary))",
                      borderRadius: "12px",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                      padding: "12px"
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 8 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 20 }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2DD4BF"
                    strokeWidth={3}
                    fill="url(#totalGradient)"
                    name="Total Oil"
                    dot={{ fill: "#2DD4BF", r: 6, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cookingOil"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#cookingGradient)"
                    name="Cooking Oil"
                    dot={{ fill: "#10B981", r: 6, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hiddenOil"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    fill="url(#hiddenGradient)"
                    name="Hidden Oil"
                    dot={{ fill: "#F59E0B", r: 6, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Last 6 Months Oil Consumption
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barTotalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="barCookingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="barHiddenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 13, fontWeight: 600, fontFamily: "system-ui" }}
                    axisLine={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    tickLine={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5 }}
                    tickMargin={10}
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 13, fontWeight: 600, fontFamily: "system-ui" }}
                    axisLine={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    tickLine={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5 }}
                    tickMargin={10}
                    width={60}
                    label={{ 
                      value: "Oil (ml)", 
                      angle: -90, 
                      position: "insideLeft", 
                      style: { 
                        fill: "hsl(var(--primary))", 
                        fontSize: 14, 
                        fontWeight: 700,
                        fontFamily: "system-ui"
                      } 
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "2px solid hsl(var(--primary))",
                      borderRadius: "12px",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                      padding: "12px"
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 8 }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 20 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#barTotalGradient)"
                    name="Total Oil"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="cookingOil"
                    fill="url(#barCookingGradient)"
                    name="Cooking Oil"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="hiddenOil"
                    fill="url(#barHiddenGradient)"
                    name="Hidden Oil"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
