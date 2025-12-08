import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Droplet, Flame, ChefHat, Sparkles } from "lucide-react";
import swiggyLogo from "@/assets/swiggy-logo.png";
import zomatoLogo from "@/assets/zomato-logo.svg";
import eatclubLogo from "@/assets/eatclub-logo.png";
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
  onOrderNow?: () => void;
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
  onOrderNow,
}: RecipeCardProps) => {
  const getOilTag = (ml: number) => {
    if (ml <= 5) return { 
      label: "Very low oil", 
      gradient: "from-emerald-500/20 to-green-500/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
      icon: "✨"
    };
    if (ml <= 10) return { 
      label: "Low oil", 
      gradient: "from-green-500/20 to-lime-500/20",
      textColor: "text-green-700 dark:text-green-400",
      icon: "🌿"
    };
    return { 
      label: "Moderate oil", 
      gradient: "from-yellow-500/20 to-amber-500/20",
      textColor: "text-yellow-700 dark:text-yellow-400",
      icon: "⚖️"
    };
  };

  const oilTag = getOilTag(oilEstimateMl);

  const getMealIcon = () => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🍽️';
      case 'dinner': return '🌙';
      case 'snack': return '🥨';
      default: return '🍴';
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer bg-card border border-border hover:border-primary/50 hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Gradient Background Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${oilTag.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Sparkle Effect on Hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
      </div>

      <div className="relative p-5 space-y-4">
        {/* Header with Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getMealIcon()}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {cuisine}
              </span>
            </div>
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
              {name}
            </h3>
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Oil Badge - Prominent */}
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${oilTag.gradient} border border-current/20`}>
          <span className="text-lg">{oilTag.icon}</span>
          <div className="flex items-center gap-1.5">
            <Droplet className={`w-4 h-4 ${oilTag.textColor}`} />
            <span className={`text-sm font-bold ${oilTag.textColor}`}>
              {oilEstimateMl}ml • {oilTag.label}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-xs font-medium px-2.5 py-0.5 bg-secondary/50 hover:bg-secondary transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {calories && (
              <div className="flex items-center gap-1.5 hover:text-orange-500 transition-colors">
                <Flame className="w-4 h-4" />
                <span className="font-semibold">{calories}</span>
              </div>
            )}
            {prepTimeMinutes && (
              <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{prepTimeMinutes}m</span>
              </div>
            )}
          </div>
          <span className="text-xs text-primary font-semibold group-hover:underline">
            View Recipe →
          </span>
        </div>

        {/* Order Now Logos */}
        {onOrderNow && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2 text-center">Order via</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.swiggy.com', '_blank');
                }}
                className="w-12 h-12 rounded-lg bg-white p-1.5 hover:scale-110 transition-transform shadow-sm border border-border"
              >
                <img src={swiggyLogo} alt="Swiggy" className="w-full h-full object-contain" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.zomato.com', '_blank');
                }}
                className="w-12 h-12 rounded-lg bg-white p-1.5 hover:scale-110 transition-transform shadow-sm border border-border"
              >
                <img src={zomatoLogo} alt="Zomato" className="w-full h-full object-contain" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.eatclub.com', '_blank');
                }}
                className="w-12 h-12 rounded-lg bg-white p-1.5 hover:scale-110 transition-transform shadow-sm border border-border"
              >
                <img src={eatclubLogo} alt="EatClub" className="w-full h-full object-contain" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecipeCard;
