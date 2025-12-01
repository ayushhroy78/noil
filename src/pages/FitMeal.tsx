import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeDetail from "@/components/recipes/RecipeDetail";
import AIRecipeBuilder from "@/components/recipes/AIRecipeBuilder";
import { useToast } from "@/hooks/use-toast";

const FitMeal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedRecipe, setGeneratedRecipe] = useState<any | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes_prebuilt')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Error",
        description: "Failed to load recipes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeClick = (recipe: any) => {
    setSelectedRecipe({
      ...recipe,
      ingredients: typeof recipe.ingredients === 'string' 
        ? JSON.parse(recipe.ingredients) 
        : recipe.ingredients,
      steps: typeof recipe.steps === 'string' 
        ? JSON.parse(recipe.steps) 
        : recipe.steps,
    });
  };

  const handleRecipeGenerated = (recipe: any) => {
    setGeneratedRecipe(recipe);
  };

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }

  if (generatedRecipe) {
    return (
      <RecipeDetail 
        recipe={generatedRecipe} 
        onBack={() => setGeneratedRecipe(null)} 
        isGenerated 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-8">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm shadow-soft px-4 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Fit Meal</h1>
            <p className="text-xs text-muted-foreground">Low-Oil Cooking Ideas</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <Tabs defaultValue="explore" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="explore">Explore Recipes</TabsTrigger>
            <TabsTrigger value="ai">AI Recipe Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading recipes...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recipes available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    name={recipe.name}
                    oilEstimateMl={recipe.oil_estimate_ml}
                    tags={recipe.tags}
                    cuisine={recipe.cuisine}
                    mealType={recipe.meal_type}
                    calories={recipe.calories}
                    prepTimeMinutes={recipe.prep_time_minutes}
                    onClick={() => handleRecipeClick(recipe)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai">
            <AIRecipeBuilder onRecipeGenerated={handleRecipeGenerated} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FitMeal;
