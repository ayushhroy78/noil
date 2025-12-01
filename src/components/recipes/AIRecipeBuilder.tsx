import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

interface AIRecipeBuilderProps {
  onRecipeGenerated: (recipe: any) => void;
}

const AIRecipeBuilder = ({ onRecipeGenerated }: AIRecipeBuilderProps) => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [mealType, setMealType] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
      toast({
        title: "Ingredients Required",
        description: "Please enter at least one ingredient",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: {
          ingredients: ingredients.trim(),
          cuisine: cuisine || undefined,
          mealType: mealType || undefined,
        }
      });

      if (error) throw error;

      if (!data.success || !data.recipe) {
        throw new Error(data.error || 'Failed to generate recipe');
      }

      const recipe = data.recipe;

      // Save to database if user is logged in
      if (user) {
        await supabase.from('generated_recipe_logs').insert({
          user_id: user.id,
          ingredients_input: ingredients,
          cuisine_preference: cuisine || null,
          meal_type: mealType || null,
          recipe_output: recipe,
          oil_estimate_ml: recipe.oil_estimate_ml,
        });
      }

      toast({
        title: "Recipe Generated!",
        description: `Created: ${recipe.name}`,
      });

      onRecipeGenerated({
        ...recipe,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        steps: Array.isArray(recipe.steps) ? recipe.steps : [],
      });

    } catch (error) {
      console.error('Error generating recipe:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate recipe",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredients You Have *</Label>
          <Textarea
            id="ingredients"
            placeholder="E.g., chicken breast, bell peppers, onions, tomatoes..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground">
            List the main ingredients you want to use
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cuisine">Cuisine (Optional)</Label>
            <Select value={cuisine} onValueChange={setCuisine}>
              <SelectTrigger id="cuisine">
                <SelectValue placeholder="Any cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any cuisine</SelectItem>
                <SelectItem value="Indian">Indian</SelectItem>
                <SelectItem value="South Indian">South Indian</SelectItem>
                <SelectItem value="Asian">Asian</SelectItem>
                <SelectItem value="Continental">Continental</SelectItem>
                <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                <SelectItem value="Chinese">Chinese</SelectItem>
                <SelectItem value="Mexican">Mexican</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mealType">Meal Type (Optional)</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger id="mealType">
                <SelectValue placeholder="Any meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any meal</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isGenerating ? "Generating Low-Oil Recipe..." : "Generate Fit Meal"}
        </Button>
      </Card>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">💡 Tip:</span> Our AI prioritizes 
          low-oil cooking methods like grilling, baking, and steaming to keep your meals healthy 
          while maximizing flavor!
        </p>
      </Card>
    </div>
  );
};

export default AIRecipeBuilder;
