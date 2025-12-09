import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BottomNav } from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeDetail from "@/components/recipes/RecipeDetail";
import AIRecipeBuilder from "@/components/recipes/AIRecipeBuilder";
import { useToast } from "@/hooks/use-toast";

const FitMeal = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedRecipe, setGeneratedRecipe] = useState<any | null>(null);
  const [filterMealType, setFilterMealType] = useState<string>("all");
  const [filterCuisine, setFilterCuisine] = useState<string>("all");

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

  const handleOrderNow = (recipe: any) => {
    const details = [
      `Hi! I would like to order the "${recipe.name}" recipe meal.`,
      '',
      'Details:',
      `- Cuisine: ${recipe.cuisine}`,
      `- Meal Type: ${recipe.meal_type}`,
      `- Oil Used: ${recipe.oil_estimate_ml}ml`,
      recipe.calories ? `- Calories: ${recipe.calories}` : '',
      '',
      'Please let me know about pricing and delivery options.'
    ].filter(Boolean).join('\n');
    
    const whatsappUrl = `https://wa.me/917892583384?text=${encodeURIComponent(details)}`;
    window.open(whatsappUrl, '_blank');
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

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesMealType = filterMealType === "all" || recipe.meal_type === filterMealType;
    const matchesCuisine = filterCuisine === "all" || recipe.cuisine === filterCuisine;
    return matchesMealType && matchesCuisine;
  });

  const mealTypes = ["all", ...new Set(recipes.map((r) => r.meal_type))];
  const cuisines = ["all", ...new Set(recipes.map((r) => r.cuisine))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-24">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm shadow-soft px-4 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('recipes.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('recipes.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <Tabs defaultValue="explore" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="explore">{t('recipes.explore')}</TabsTrigger>
            <TabsTrigger value="ai">{t('recipes.aiBuilder')}</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="space-y-6">
            {/* Filter Pills */}
            {!isLoading && recipes.length > 0 && (
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Meal Type Filter */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground px-1">{t('recipes.mealType')}</p>
                  <div className="flex flex-wrap gap-2">
                    {mealTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterMealType(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          filterMealType === type
                            ? "bg-primary text-primary-foreground shadow-lg scale-105"
                            : "bg-secondary/50 text-foreground hover:bg-secondary hover:scale-105"
                        }`}
                      >
                        {type === "all" ? "All Meals" : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuisine Filter */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground px-1">{t('recipes.cuisine')}</p>
                  <div className="flex flex-wrap gap-2">
                    {cuisines.map((cuisine) => (
                      <button
                        key={cuisine}
                        onClick={() => setFilterCuisine(cuisine)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          filterCuisine === cuisine
                            ? "bg-primary text-primary-foreground shadow-lg scale-105"
                            : "bg-secondary/50 text-foreground hover:bg-secondary hover:scale-105"
                        }`}
                      >
                        {cuisine === "all" ? "All Cuisines" : cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-bold text-primary">{filteredRecipes.length}</span> recipes
                  </p>
                </div>
              </div>
            )}

            {/* Recipe Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">Loading delicious recipes...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
                <p className="text-muted-foreground">No recipes available yet</p>
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl">🔍</span>
                </div>
                <p className="text-muted-foreground">No recipes match your filters</p>
                <button
                  onClick={() => {
                    setFilterMealType("all");
                    setFilterCuisine("all");
                  }}
                  className="mt-4 text-primary font-medium hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filteredRecipes.map((recipe) => (
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
                    onOrderNow={() => handleOrderNow(recipe)}
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

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default FitMeal;
