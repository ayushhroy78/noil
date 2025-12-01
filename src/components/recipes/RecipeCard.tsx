import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Droplet, Flame } from "lucide-react";

interface RecipeCardProps {
  id: string;
  name: string;
  oilEstimateMl: number;
  tags: string[];
  cuisine: string;
  mealType: string;
  calories?: number;
  prepTimeMinutes?: number;
  onClick: () => void;
}

const RecipeCard = ({
  name,
  oilEstimateMl,
  tags,
  cuisine,
  mealType,
  calories,
  prepTimeMinutes,
  onClick,
}: RecipeCardProps) => {
  const getOilTag = (ml: number) => {
    if (ml <= 5) return { label: "Very low oil", color: "bg-green-500/10 text-green-700" };
    if (ml <= 10) return { label: "Low oil", color: "bg-emerald-500/10 text-emerald-700" };
    return { label: "Moderate oil", color: "bg-yellow-500/10 text-yellow-700" };
  };

  const oilTag = getOilTag(oilEstimateMl);

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-all cursor-pointer bg-card border-border"
      onClick={onClick}
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">
            {cuisine} • {mealType}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={oilTag.color}>
            <Droplet className="w-3 h-3 mr-1" />
            {oilTag.label}
          </Badge>
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Droplet className="w-4 h-4" />
            <span>{oilEstimateMl}ml oil</span>
          </div>
          {calories && (
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4" />
              <span>{calories} cal</span>
            </div>
          )}
          {prepTimeMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{prepTimeMinutes}m</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecipeCard;
