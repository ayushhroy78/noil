import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, subWeeks, format, endOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklyOilTrendsProps {
  userId: string;
}

interface WeekData {
  week: string;
  [key: string]: string | number;
}

const OIL_COLORS: Record<string, string> = {
  mustard: "#F59E0B",
  groundnut: "#D97706",
  olive: "#84CC16",
  coconut: "#06B6D4",
  sunflower: "#FBBF24",
  sesame: "#A855F7",
  "rice bran": "#10B981",
  refined: "#6B7280",
  vegetable: "#9CA3AF",
  other: "#94A3B8",
};

const getOilColor = (oilType: string): string => {
  const normalizedType = oilType.toLowerCase();
  for (const [key, color] of Object.entries(OIL_COLORS)) {
    if (normalizedType.includes(key)) {
      return color;
    }
  }
  return OIL_COLORS.other;
};

export const WeeklyOilTrends = ({ userId }: WeeklyOilTrendsProps) => {
  const [data, setData] = useState<WeekData[]>([]);
  const [oilTypes, setOilTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const weeks: WeekData[] = [];
        const allOilTypes = new Set<string>();
        const now = new Date();

        // Fetch last 4 weeks of data
        for (let i = 3; i >= 0; i--) {
          const weekStart = startOfWeek(subWeeks(now, i));
          const weekEnd = endOfWeek(subWeeks(now, i));

          const { data: logs } = await supabase
            .from("daily_logs")
            .select("amount_ml, oil_type")
            .eq("user_id", userId)
            .gte("log_date", weekStart.toISOString())
            .lte("log_date", weekEnd.toISOString());

          const { data: bottles } = await supabase
            .from("bottles")
            .select("quantity_ml, oil_type, finish_date")
            .eq("user_id", userId)
            .gte("finish_date", weekStart.toISOString())
            .lte("finish_date", weekEnd.toISOString());

          const weekData: WeekData = {
            week: format(weekStart, "MMM d"),
          };

          // Aggregate by oil type
          const oilTypeMap: Record<string, number> = {};

          logs?.forEach((log) => {
            const type = log.oil_type || "other";
            oilTypeMap[type] = (oilTypeMap[type] || 0) + Number(log.amount_ml);
            allOilTypes.add(type);
          });

          bottles?.forEach((bottle) => {
            const type = bottle.oil_type || "other";
            oilTypeMap[type] = (oilTypeMap[type] || 0) + Number(bottle.quantity_ml);
            allOilTypes.add(type);
          });

          Object.entries(oilTypeMap).forEach(([type, amount]) => {
            weekData[type] = Math.round(amount);
          });

          weeks.push(weekData);
        }

        setData(weeks);
        setOilTypes(Array.from(allOilTypes));
      } catch (error) {
        console.error("Error fetching weekly trends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [userId]);

  if (loading) {
    return (
      <Card className="border-border/40 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Weekly Oil Type Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (oilTypes.length === 0) {
    return (
      <Card className="border-border/40 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Weekly Oil Type Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">
            Not enough data to show trends.
            <br />
            Keep logging to see your weekly patterns!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Weekly Oil Type Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'ml', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [`${value} ml`, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Legend 
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
              {oilTypes.map((type) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="a"
                  fill={getOilColor(type)}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Last 4 weeks of oil consumption by type
        </p>
      </CardContent>
    </Card>
  );
};