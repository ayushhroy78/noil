import { ArrowLeft, Droplet, Clock, Flame, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface RecipeDetailProps {
  recipe: {
    id?: string;
    name: string;
    ingredients: string[];
    steps: string[];
    oil_estimate_ml: number;
    tags?: string[];
    cuisine?: string;
    meal_type?: string;
    calories?: number;
    prep_time_minutes?: number;
    cooking_method?: string;
    health_benefits?: string;
    calories_approx?: number;
  };
  onBack: () => void;
  isGenerated?: boolean;
}

const RecipeDetail = ({ recipe, onBack, isGenerated = false }: RecipeDetailProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);

  const getOilTag = (ml: number) => {
    if (ml <= 5) return { label: "Very low oil", color: "bg-green-500/10 text-green-700" };
    if (ml <= 10) return { label: "Low oil", color: "bg-emerald-500/10 text-emerald-700" };
    return { label: "Moderate oil", color: "bg-yellow-500/10 text-yellow-700" };
  };

  const oilTag = getOilTag(recipe.oil_estimate_ml);
  const displayCalories = recipe.calories || recipe.calories_approx;

  const handleLogToTracking = async () => {
    setIsLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to log oil consumption",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("daily_logs").insert({
        user_id: user.id,
        amount_ml: recipe.oil_estimate_ml,
        source: `Fit Meal: ${recipe.name}`,
        notes: `Cooked ${recipe.name} from ${isGenerated ? 'AI-generated' : 'prebuilt'} recipe`,
        log_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      toast({
        title: "Logged Successfully",
        description: `${recipe.oil_estimate_ml}ml oil logged to tracking`,
      });

    } catch (error) {
      console.error('Error logging to tracking:', error);
      toast({
        title: "Error",
        description: "Failed to log oil consumption",
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  const handleOrderNow = () => {
    const details = [
      `Hi! I would like to order the "${recipe.name}" recipe meal.`,
      '',
      'Details:',
      `- Cuisine: ${recipe.cuisine || 'N/A'}`,
      `- Meal Type: ${recipe.meal_type || 'N/A'}`,
      `- Oil Used: ${recipe.oil_estimate_ml}ml`,
      displayCalories ? `- Calories: ${displayCalories}` : '',
      '',
      'Please let me know about pricing and delivery options.'
    ].filter(Boolean).join('\n');
    
    const whatsappUrl = `https://wa.me/917892583384?text=${encodeURIComponent(details)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm shadow-soft px-4 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Recipe Details</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{recipe.name}</h2>
            {recipe.cuisine && recipe.meal_type && (
              <p className="text-muted-foreground mb-3">
                {recipe.cuisine} • {recipe.meal_type}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge className={oilTag.color}>
                <Droplet className="w-3 h-3 mr-1" />
                {oilTag.label}
              </Badge>
              {recipe.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              <span className="font-medium">{recipe.oil_estimate_ml}ml oil</span>
            </div>
            {displayCalories && (
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span>{displayCalories} cal</span>
              </div>
            )}
            {recipe.prep_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>{recipe.prep_time_minutes}m</span>
              </div>
            )}
          </div>
        </Card>

        {recipe.health_benefits && (
          <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-foreground mb-2">Health Benefits</h3>
            <p className="text-sm text-muted-foreground">{recipe.health_benefits}</p>
          </Card>
        )}

        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Instructions</h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-foreground pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        {/* Order Now Card */}
        <Card className="p-4 bg-green-600/10 border-green-600/30">
          <div className="flex items-start gap-3 mb-3">
            <ShoppingCart className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Order This Meal</h4>
              <p className="text-sm text-muted-foreground">
                Don't feel like cooking? Order this healthy meal prepared fresh for you
              </p>
            </div>
          </div>
          <Button
            onClick={handleOrderNow}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Order Now via WhatsApp
          </Button>
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3 mb-3">
            <Plus className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Log to Tracking</h4>
              <p className="text-sm text-muted-foreground">
                Add this recipe's oil consumption ({recipe.oil_estimate_ml}ml) to your daily tracking
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogToTracking}
            disabled={isLogging}
            className="w-full"
          >
            {isLogging ? "Logging..." : "Cooked This – Log Oil Usage"}
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default RecipeDetail;
