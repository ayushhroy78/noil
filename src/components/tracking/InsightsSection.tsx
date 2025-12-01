import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, AlertCircle, CheckCircle } from "lucide-react";

interface Insight {
  type: "positive" | "warning" | "info";
  message: string;
}

interface InsightsSectionProps {
  insights: Insight[];
}

export const InsightsSection = ({ insights }: InsightsSectionProps) => {
  if (insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <Lightbulb className="w-4 h-4 text-primary" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-success/5 border-success/20";
      case "warning":
        return "bg-warning/5 border-warning/20";
      default:
        return "bg-primary/5 border-primary/20";
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        Insights
      </h3>
      {insights.map((insight, index) => (
        <Card key={index} className={`border ${getBgColor(insight.type)} shadow-soft`}>
          <CardContent className="p-3 flex items-start gap-3">
            {getIcon(insight.type)}
            <p className="text-sm text-foreground flex-1">{insight.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
