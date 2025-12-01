import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Last 7 Days Oil Consumption
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: "ml", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cookingOil" fill="hsl(var(--primary))" name="Cooking Oil" />
                  <Bar dataKey="hiddenOil" fill="hsl(var(--destructive))" name="Hidden Oil" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Last 6 Months Oil Consumption
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: "ml", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Total Oil"
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cookingOil"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Cooking Oil"
                    dot={{ fill: "hsl(var(--secondary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hiddenOil"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="Hidden Oil"
                    dot={{ fill: "hsl(var(--destructive))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
