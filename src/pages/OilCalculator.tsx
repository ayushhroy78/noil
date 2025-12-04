import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, Target, DollarSign, Heart, Leaf, Lightbulb, Calendar, TreePine, Info, Plus, Trash2, Check, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OilGoal {
  id: string;
  name: string;
  family_size: number;
  current_annual_oil_kg: number;
  target_reduction_percent: number;
  oil_price_per_liter: number;
  is_active: boolean;
  created_at: string;
}

const OilCalculator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [savedGoals, setSavedGoals] = useState<OilGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState("My Goal");
  const [familySize, setFamilySize] = useState("1");
  const [currentAnnualOil, setCurrentAnnualOil] = useState("45");
  const [targetReduction, setTargetReduction] = useState("10");
  const [oilPrice, setOilPrice] = useState("150");
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Fetch user and saved goals
  useEffect(() => {
    const fetchUserAndGoals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchGoals(user.id);
      }
      setLoading(false);
    };
    fetchUserAndGoals();
  }, []);

  const fetchGoals = async (uid: string) => {
    const { data, error } = await supabase
      .from("oil_reduction_goals")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedGoals(data);
      // Load the active goal if exists
      const activeGoal = data.find(g => g.is_active);
      if (activeGoal) {
        loadGoal(activeGoal);
      }
    }
  };

  const loadGoal = (goal: OilGoal) => {
    setSelectedGoalId(goal.id);
    setGoalName(goal.name);
    setFamilySize(goal.family_size.toString());
    setCurrentAnnualOil(goal.current_annual_oil_kg.toString());
    setTargetReduction(goal.target_reduction_percent.toString());
    setOilPrice(goal.oil_price_per_liter.toString());
    setCalculated(true);
  };

  // Calculated values
  const currentAnnualKg = parseFloat(currentAnnualOil) || 0;
  const currentDailyMl = Math.round((currentAnnualKg * 1000) / 365);
  const reductionPercent = parseFloat(targetReduction) || 0;
  const targetDailyMl = Math.round(currentDailyMl * (1 - reductionPercent / 100));
  const annualSavingsKg = (currentAnnualKg * reductionPercent) / 100;
  const pricePerLiter = parseFloat(oilPrice) || 150;
  const annualSavingsRupees = Math.round(annualSavingsKg * pricePerLiter);
  const monthlySavingsRupees = Math.round(annualSavingsRupees / 12);
  
  // Health calculations
  const caloriesPerMl = 9;
  const calorieReduction = Math.round(annualSavingsKg * 1000 * caloriesPerMl);
  const healthScore = Math.min(100, Math.max(0, 100 - Math.round(currentDailyMl / 3)));
  
  // Environmental impact
  const carbonFootprintKg = Math.round(annualSavingsKg * 2.7 * 10) / 10;
  const treesEquivalent = Math.max(1, Math.round(carbonFootprintKg / 12));

  // 6-month projection
  const monthlyProjection = Array.from({ length: 6 }, (_, i) => ({
    month: i + 1,
    saved: Math.round((annualSavingsKg / 12) * (i + 1) * 10) / 10,
    progress: ((i + 1) / 6) * 100,
  }));

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 50) return "Needs Improvement";
    return "High Risk";
  };

  const recommendations = [
    currentDailyMl > 30 && "Your current consumption is high. Try using air fryer or baking instead of deep frying.",
    "Use spray bottles for even oil distribution - reduces usage by 30%.",
    "Try non-stick cookware to minimize oil requirements.",
    currentDailyMl > 25 && "Consider steaming vegetables instead of sautéing.",
  ].filter(Boolean);

  const handleCalculate = () => {
    if (!currentAnnualOil || parseFloat(currentAnnualOil) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid annual oil consumption.",
        variant: "destructive",
      });
      return;
    }
    setCalculated(true);
  };

  const handleSaveGoal = async () => {
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please login to save your goals.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!goalName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your goal.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Set all other goals to inactive if this is a new active goal
      await supabase
        .from("oil_reduction_goals")
        .update({ is_active: false })
        .eq("user_id", userId);

      if (selectedGoalId) {
        // Update existing goal
        const { error } = await supabase
          .from("oil_reduction_goals")
          .update({
            name: goalName,
            family_size: parseInt(familySize),
            current_annual_oil_kg: parseFloat(currentAnnualOil),
            target_reduction_percent: parseFloat(targetReduction),
            oil_price_per_liter: parseFloat(oilPrice),
            is_active: true,
          })
          .eq("id", selectedGoalId);

        if (error) throw error;
        toast({
          title: "Goal Updated!",
          description: `"${goalName}" has been updated.`,
        });
      } else {
        // Create new goal
        const { error } = await supabase
          .from("oil_reduction_goals")
          .insert({
            user_id: userId,
            name: goalName,
            family_size: parseInt(familySize),
            current_annual_oil_kg: parseFloat(currentAnnualOil),
            target_reduction_percent: parseFloat(targetReduction),
            oil_price_per_liter: parseFloat(oilPrice),
            is_active: true,
          });

        if (error) throw error;
        toast({
          title: "Goal Saved!",
          description: `"${goalName}" has been saved.`,
        });
      }

      await fetchGoals(userId);
      setShowSaveDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("oil_reduction_goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Goal Deleted",
      description: `"${goalName}" has been removed.`,
    });

    if (selectedGoalId === goalId) {
      setSelectedGoalId(null);
      resetForm();
    }

    await fetchGoals(userId);
  };

  const handleSetActive = async (goal: OilGoal) => {
    if (!userId) return;

    await supabase
      .from("oil_reduction_goals")
      .update({ is_active: false })
      .eq("user_id", userId);

    await supabase
      .from("oil_reduction_goals")
      .update({ is_active: true })
      .eq("id", goal.id);

    loadGoal({ ...goal, is_active: true });
    await fetchGoals(userId);

    toast({
      title: "Goal Activated",
      description: `"${goal.name}" is now your active goal.`,
    });
  };

  const resetForm = () => {
    setGoalName("My Goal");
    setFamilySize("1");
    setCurrentAnnualOil("45");
    setTargetReduction("10");
    setOilPrice("150");
    setCalculated(false);
  };

  const handleNewGoal = () => {
    setSelectedGoalId(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Oil Calculator</h1>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewGoal}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Saved Goals Section */}
        {savedGoals.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Saved Goals</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {savedGoals.map((goal) => (
                <Card 
                  key={goal.id}
                  className={`flex-shrink-0 w-48 cursor-pointer transition-all ${
                    goal.is_active 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => loadGoal(goal)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{goal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {goal.family_size} person{goal.family_size > 1 ? "s" : ""} • {goal.target_reduction_percent}% reduction
                        </p>
                      </div>
                      {goal.is_active && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!goal.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(goal);
                          }}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(goal.id, goal.name);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Calculator Input Section */}
        <Card className="border-0 shadow-medium">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Calculate Your Oil Reduction Goal</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Set your family's oil consumption goals and track your progress toward healthier cooking habits.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Family Size</Label>
                <Select value={familySize} onValueChange={setFamilySize}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} {size === 1 ? "person" : "persons"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Annual Oil (kg)</Label>
                <Input
                  type="number"
                  value={currentAnnualOil}
                  onChange={(e) => setCurrentAnnualOil(e.target.value)}
                  className="bg-secondary border-0"
                  placeholder="45"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Reduction (%)</Label>
                <Select value={targetReduction} onValueChange={setTargetReduction}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue placeholder="Select %" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {[5, 10, 15, 20, 25, 30].map((percent) => (
                      <SelectItem key={percent} value={percent.toString()}>
                        {percent}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Oil Price (₹/L)</Label>
                <Input
                  type="number"
                  value={oilPrice}
                  onChange={(e) => setOilPrice(e.target.value)}
                  className="bg-secondary border-0"
                  placeholder="150"
                />
              </div>
            </div>

            <Button 
              onClick={handleCalculate}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Reduction Goal
            </Button>
          </CardContent>
        </Card>

        {calculated && (
          <>
            {/* Personalized Goals */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Your Personalized Goals</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border border-border/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Current Daily Oil</p>
                    <p className="text-2xl font-bold text-foreground">{currentDailyMl} ml</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-success">Target Daily Oil</p>
                    <p className="text-2xl font-bold text-success">{targetDailyMl} ml</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50">
                  <CardContent className="p-4 flex items-start gap-2">
                    <span className="text-warning">↘</span>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Savings</p>
                      <p className="text-2xl font-bold text-warning">{annualSavingsKg.toFixed(1)} kg</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Reduction Target</p>
                    <p className="text-2xl font-bold text-success">{targetReduction}%</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Financial Impact */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-warning" />
                <h2 className="text-lg font-semibold text-foreground">Financial Impact</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-warning/10 border-0">
                  <CardContent className="p-4">
                    <p className="text-sm text-warning">Annual Savings</p>
                    <p className="text-2xl font-bold text-warning">₹{annualSavingsRupees.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Based on ₹{pricePerLiter}/L</p>
                  </CardContent>
                </Card>
                <Card className="bg-warning/10 border-0">
                  <CardContent className="p-4">
                    <p className="text-sm text-warning">Monthly Savings</p>
                    <p className="text-2xl font-bold text-warning">₹{monthlySavingsRupees}</p>
                    <p className="text-xs text-muted-foreground">Save on grocery bills</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Health Impact */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                <h2 className="text-lg font-semibold text-foreground">Health Impact</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-warning/10 border-0">
                  <CardContent className="p-4">
                    <p className="text-sm text-warning">Calorie Reduction</p>
                    <p className="text-2xl font-bold text-warning">{calorieReduction.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Calories/year</p>
                  </CardContent>
                </Card>
                <Card className="bg-warning/10 border-0">
                  <CardContent className="p-4">
                    <p className="text-sm text-warning">Health Score</p>
                    <p className={`text-2xl font-bold ${getHealthScoreColor(healthScore)}`}>{healthScore}/100</p>
                    <Progress value={healthScore} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{getHealthScoreLabel(healthScore)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                <h2 className="text-lg font-semibold text-foreground">Environmental Impact</h2>
              </div>
              <Card className="bg-success/10 border-0">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm text-success">Carbon Footprint Reduction</p>
                  <p className="text-2xl font-bold text-success">{carbonFootprintKg} kg</p>
                  <p className="text-xs text-muted-foreground">CO₂ equivalent saved per year</p>
                  <div className="flex items-center gap-2 bg-success/20 rounded-lg p-2 mt-2">
                    <TreePine className="w-4 h-4 text-success" />
                    <p className="text-sm text-success font-medium">
                      That's like planting {treesEquivalent} {treesEquivalent === 1 ? "tree" : "trees"} per year!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Personalized Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Personalized Recommendations</h2>
              </div>
              <Card className="bg-primary/5 border-0">
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* 6-Month Progress Projection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">6-Month Progress Projection</h2>
              </div>
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4 space-y-4">
                  {monthlyProjection.map((month) => (
                    <div key={month.month} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Month {month.month}</span>
                        <span className="text-sm text-muted-foreground">{month.saved} kg saved</span>
                      </div>
                      <div className="relative h-3 bg-warning/20 rounded-full overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-success rounded-full transition-all duration-500"
                          style={{ width: `${month.progress * 0.6}%` }}
                        />
                        <div 
                          className="absolute top-0 h-full bg-warning rounded-full transition-all duration-500"
                          style={{ left: `${month.progress * 0.6}%`, width: `${100 - month.progress * 0.6}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Key Health Benefits */}
            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Key Health Benefits:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    Reduced risk of heart disease and obesity
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    Better cholesterol levels and blood pressure
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    Improved overall cardiovascular health
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    More nutritious, balanced meals
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Save Goal Button */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6"
                >
                  {selectedGoalId ? "Update Goal" : "Save Goal"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle>{selectedGoalId ? "Update Goal" : "Save Your Goal"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Goal Name</Label>
                    <Input
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      placeholder="e.g., Family of 4 - Weekly Goal"
                      className="bg-secondary border-0"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {familySize} person{parseInt(familySize) > 1 ? "s" : ""} • {currentAnnualOil}kg/year • {targetReduction}% reduction
                  </p>
                  <Button
                    onClick={handleSaveGoal}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "Saving..." : selectedGoalId ? "Update Goal" : "Save Goal"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Why Reduce Oil?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Excessive oil consumption is linked to obesity, heart disease, and other health issues. 
                    The WHO recommends limiting oil intake to maintain a healthy diet.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">How It Works</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set your reduction goal, track daily consumption, and receive personalized recipes 
                    and tips to help you achieve your target gradually and sustainably.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default OilCalculator;
