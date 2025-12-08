import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Droplets } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface OilTypeChartProps {
  userId: string;
}

interface OilTypeData {
  name: string;
  value: number;
  color: string;
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

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const OilTypeChart = ({ userId }: OilTypeChartProps) => {
  const [data, setData] = useState<OilTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOil, setTotalOil] = useState(0);

  useEffect(() => {
    const fetchOilTypeData = async () => {
      try {
        const monthStart = startOfMonth(new Date());

        // Fetch daily logs with oil types
        const { data: logs } = await supabase
          .from("daily_logs")
          .select("amount_ml, oil_type")
          .eq("user_id", userId)
          .gte("log_date", monthStart.toISOString());

        // Fetch bottles with oil types
        const { data: bottles } = await supabase
          .from("bottles")
          .select("quantity_ml, oil_type, finish_date")
          .eq("user_id", userId)
          .gte("start_date", monthStart.toISOString());

        // Aggregate oil types
        const oilTypeMap: Record<string, number> = {};

        // Add daily logs
        logs?.forEach((log) => {
          const type = log.oil_type || "other";
          oilTypeMap[type] = (oilTypeMap[type] || 0) + Number(log.amount_ml);
        });

        // Add bottle consumption (if finished this month)
        bottles?.forEach((bottle) => {
          if (bottle.finish_date) {
            const type = bottle.oil_type || "other";
            oilTypeMap[type] = (oilTypeMap[type] || 0) + Number(bottle.quantity_ml);
          }
        });

        // Convert to chart data
        const chartData: OilTypeData[] = Object.entries(oilTypeMap)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({
            name: capitalizeFirst(name),
            value: Math.round(value),
            color: getOilColor(name),
          }))
          .sort((a, b) => b.value - a.value);

        const total = chartData.reduce((sum, item) => sum + item.value, 0);
        setTotalOil(total);
        setData(chartData);
      } catch (error) {
        console.error("Error fetching oil type data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOilTypeData();
  }, [userId]);

  if (loading) {
    return (
      <Card className="border-border/40 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplets className="w-5 h-5 text-primary" />
            Oil Types Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border/40 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplets className="w-5 h-5 text-primary" />
            Oil Types Used
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Droplets className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">
            No oil consumption data this month.
            <br />
            Start logging to see your oil type breakdown!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Droplets className="w-5 h-5 text-primary" />
          Oil Types Used This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} ml`, "Amount"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{totalOil} ml</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};