import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight, Heart, Flame, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface OilRecommendationsProps {
  userId: string;
}

interface OilHealthInfo {
  name: string;
  healthRating: "excellent" | "good" | "moderate" | "poor";
  smokePoint: string;
  bestFor: string[];
  benefits: string[];
  concerns: string[];
}

const OIL_HEALTH_DATA: Record<string, OilHealthInfo> = {
  mustard: {
    name: "Mustard Oil",
    healthRating: "excellent",
    smokePoint: "250°C",
    bestFor: ["Indian cooking", "Stir-frying", "Pickling"],
    benefits: ["Rich in omega-3", "Antibacterial", "Heart-healthy"],
    concerns: [],
  },
  groundnut: {
    name: "Groundnut Oil",
    healthRating: "good",
    smokePoint: "230°C",
    bestFor: ["Deep frying", "Indian cooking", "Stir-frying"],
    benefits: ["High smoke point", "Good fats", "Vitamin E rich"],
    concerns: ["High in omega-6"],
  },
  olive: {
    name: "Olive Oil",
    healthRating: "excellent",
    smokePoint: "190°C (Extra Virgin)",
    bestFor: ["Salads", "Light sautéing", "Mediterranean dishes"],
    benefits: ["Heart-healthy", "Antioxidants", "Anti-inflammatory"],
    concerns: ["Not ideal for high-heat cooking"],
  },
  coconut: {
    name: "Coconut Oil",
    healthRating: "good",
    smokePoint: "175°C",
    bestFor: ["South Indian cooking", "Baking", "Medium-heat cooking"],
    benefits: ["MCTs for energy", "Antimicrobial", "Stable at room temp"],
    concerns: ["High in saturated fat"],
  },
  sunflower: {
    name: "Sunflower Oil",
    healthRating: "moderate",
    smokePoint: "230°C",
    bestFor: ["Frying", "Baking", "General cooking"],
    benefits: ["High smoke point", "Light flavor", "Vitamin E"],
    concerns: ["High omega-6", "Often refined"],
  },
  sesame: {
    name: "Sesame Oil",
    healthRating: "excellent",
    smokePoint: "210°C",
    bestFor: ["Asian cooking", "Finishing oil", "Dressings"],
    benefits: ["Antioxidants", "Heart-healthy", "Anti-inflammatory"],
    concerns: [],
  },
  "rice bran": {
    name: "Rice Bran Oil",
    healthRating: "good",
    smokePoint: "250°C",
    bestFor: ["Deep frying", "All-purpose cooking", "Asian dishes"],
    benefits: ["High smoke point", "Balanced fats", "Oryzanol"],
    concerns: [],
  },
  refined: {
    name: "Refined Oil",
    healthRating: "poor",
    smokePoint: "Varies",
    bestFor: ["High-heat cooking"],
    benefits: ["High smoke point", "Neutral flavor"],
    concerns: ["Nutrient loss", "Chemical processing", "Often unhealthy fats"],
  },
  vegetable: {
    name: "Vegetable Oil",
    healthRating: "poor",
    smokePoint: "Varies",
    bestFor: ["General cooking"],
    benefits: ["Affordable", "Neutral flavor"],
    concerns: ["Often highly processed", "Unknown blend", "High omega-6"],
  },
};

const HEALTH_ALTERNATIVES: Record<string, string[]> = {
  refined: ["mustard", "groundnut", "rice bran"],
  vegetable: ["mustard", "groundnut", "coconut"],
  sunflower: ["olive", "mustard", "sesame"],
};

interface Recommendation {
  type: "switch" | "tip" | "praise";
  title: string;
  description: string;
  icon: React.ReactNode;
  priority: number;
}

export const OilRecommendations = ({ userId }: OilRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [topOils, setTopOils] = useState<{ type: string; amount: number }[]>([]);

  useEffect(() => {
    const analyzeAndRecommend = async () => {
      try {
        const monthStart = startOfMonth(new Date());

        const { data: logs } = await supabase
          .from("daily_logs")
          .select("amount_ml, oil_type")
          .eq("user_id", userId)
          .gte("log_date", monthStart.toISOString());

        const { data: bottles } = await supabase
          .from("bottles")
          .select("quantity_ml, oil_type")
          .eq("user_id", userId)
          .gte("start_date", monthStart.toISOString());

        // Aggregate oil usage
        const oilUsage: Record<string, number> = {};

        logs?.forEach((log) => {
          const type = log.oil_type || "other";
          oilUsage[type] = (oilUsage[type] || 0) + Number(log.amount_ml);
        });

        bottles?.forEach((bottle) => {
          const type = bottle.oil_type || "other";
          oilUsage[type] = (oilUsage[type] || 0) + Number(bottle.quantity_ml);
        });

        const sortedOils = Object.entries(oilUsage)
          .map(([type, amount]) => ({ type, amount }))
          .sort((a, b) => b.amount - a.amount);

        setTopOils(sortedOils.slice(0, 3));

        // Generate recommendations
        const recs: Recommendation[] = [];

        sortedOils.forEach(({ type, amount }) => {
          const normalizedType = type.toLowerCase();

          // Check for unhealthy oils
          if (HEALTH_ALTERNATIVES[normalizedType]) {
            const alternatives = HEALTH_ALTERNATIVES[normalizedType]
              .map((alt) => OIL_HEALTH_DATA[alt]?.name)
              .filter(Boolean)
              .join(", ");

            recs.push({
              type: "switch",
              title: `Switch from ${type.charAt(0).toUpperCase() + type.slice(1)} Oil`,
              description: `Consider switching to healthier alternatives like ${alternatives} for better nutrition.`,
              icon: <ArrowRight className="w-5 h-5 text-amber-500" />,
              priority: 1,
            });
          }

          // Praise for healthy choices
          if (["mustard", "olive", "sesame"].includes(normalizedType)) {
            recs.push({
              type: "praise",
              title: `Great choice with ${type.charAt(0).toUpperCase() + type.slice(1)} Oil!`,
              description: OIL_HEALTH_DATA[normalizedType]?.benefits.join(". ") + ".",
              icon: <Heart className="w-5 h-5 text-green-500" />,
              priority: 3,
            });
          }
        });

        // Add general tips
        if (sortedOils.length > 0) {
          const totalOil = sortedOils.reduce((sum, o) => sum + o.amount, 0);
          const avgDaily = totalOil / 30;

          if (avgDaily > 30) {
            recs.push({
              type: "tip",
              title: "Reduce Overall Oil Consumption",
              description: `You're averaging ${Math.round(avgDaily)} ml/day. Try air-frying, baking, or steaming to reduce oil usage.`,
              icon: <Flame className="w-5 h-5 text-red-500" />,
              priority: 0,
            });
          }

          if (sortedOils.length === 1) {
            recs.push({
              type: "tip",
              title: "Diversify Your Oil Types",
              description: "Using a variety of healthy oils provides different nutrients. Try rotating between 2-3 types weekly.",
              icon: <Leaf className="w-5 h-5 text-teal-500" />,
              priority: 2,
            });
          }
        }

        // Sort by priority and limit
        recs.sort((a, b) => a.priority - b.priority);
        setRecommendations(recs.slice(0, 4));
      } catch (error) {
        console.error("Error generating recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    analyzeAndRecommend();
  }, [userId]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "good":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "moderate":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "poor":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="border-border/40 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
            Oil Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-primary" />
          Oil Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top oils used with health ratings */}
        {topOils.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Your Top Oils This Month</p>
            <div className="flex flex-wrap gap-2">
              {topOils.map(({ type, amount }) => {
                const normalizedType = type.toLowerCase();
                const healthInfo = OIL_HEALTH_DATA[normalizedType];
                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`${healthInfo ? getRatingColor(healthInfo.healthRating) : ""} px-3 py-1`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({Math.round(amount)} ml)
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  rec.type === "switch"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : rec.type === "praise"
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-muted/50 border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{rec.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Lightbulb className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Start logging oil usage to get personalized recommendations!
            </p>
          </div>
        )}

        {/* Health rating legend */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Health Rating Guide:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getRatingColor("excellent")}>Excellent</Badge>
            <Badge variant="outline" className={getRatingColor("good")}>Good</Badge>
            <Badge variant="outline" className={getRatingColor("moderate")}>Moderate</Badge>
            <Badge variant="outline" className={getRatingColor("poor")}>Poor</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};