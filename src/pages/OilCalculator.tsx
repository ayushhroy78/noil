import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, Target, DollarSign, Heart, Leaf, Lightbulb, Calendar, TreePine, Info, Plus, Trash2, Check, Edit2, Scale, Wallet, Droplets } from "lucide-react";
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
import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";

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

const oilTypes = [
  { value: "mustard", label: "Mustard Oil", price: 180, healthScore: 85, emoji: "🌿", benefits: ["Heart-healthy", "High Omega-3", "Anti-inflammatory"] },
  { value: "groundnut", label: "Groundnut Oil", price: 200, healthScore: 80, emoji: "🥜", benefits: ["High smoke point", "Vitamin E rich", "Good for frying"] },
  { value: "coconut", label: "Coconut Oil", price: 220, healthScore: 75, emoji: "🥥", benefits: ["MCT content", "Antimicrobial", "Good for skin"] },
  { value: "olive", label: "Olive Oil", price: 450, healthScore: 95, emoji: "🫒", benefits: ["Best for heart", "Antioxidants", "Mediterranean diet"] },
  { value: "sunflower", label: "Sunflower Oil", price: 140, healthScore: 65, emoji: "🌻", benefits: ["Affordable", "Light taste", "Vitamin E"] },
  { value: "rice_bran", label: "Rice Bran Oil", price: 160, healthScore: 82, emoji: "🌾", benefits: ["Balanced fats", "High smoke point", "Heart-healthy"] },
  { value: "sesame", label: "Sesame Oil", price: 280, healthScore: 88, emoji: "🫘", benefits: ["Rich flavor", "Antioxidants", "Good for Asian cuisine"] },
  { value: "refined", label: "Refined Oil", price: 120, healthScore: 40, emoji: "🛢️", benefits: ["Cheap", "Neutral taste", "High smoke point"] },
];

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
  const [selectedOilType, setSelectedOilType] = useState("mustard");
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [compareOils, setCompareOils] = useState<string[]>(["mustard", "olive"]);

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
  const selectedOil = oilTypes.find(o => o.value === selectedOilType) || oilTypes[0];
  const pricePerLiter = selectedOil.price;
  const annualSavingsRupees = Math.round(annualSavingsKg * pricePerLiter);
  const monthlySavingsRupees = Math.round(annualSavingsRupees / 12);
  
  // Health calculations
  const caloriesPerMl = 9;
  const calorieReduction = Math.round(annualSavingsKg * 1000 * caloriesPerMl);
  const healthScore = Math.min(100, Math.max(0, Math.round(selectedOil.healthScore - (currentDailyMl / 5))));
  
  // Environmental impact
  const carbonFootprintKg = Math.round(annualSavingsKg * 2.7 * 10) / 10;
  const treesEquivalent = Math.max(1, Math.round(carbonFootprintKg / 12));

  // 6-month projection
  const monthlyProjection = Array.from({ length: 6 }, (_, i) => ({
    month: i + 1,
    saved: Math.round((annualSavingsKg / 12) * (i + 1) * 10) / 10,
    progress: ((i + 1) / 6) * 100,
  }));

  // Monthly budget calculation
  const monthlyOilNeededLiters = (currentAnnualKg * (1 - reductionPercent / 100)) / 12;
  const monthlyBudget = Math.round(monthlyOilNeededLiters * pricePerLiter);

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
    selectedOil.healthScore < 70 && `Consider switching to ${oilTypes.find(o => o.healthScore > 80)?.label} for better health benefits.`,
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
                <Label className="text-sm font-medium">Primary Oil Type</Label>
                <Select value={selectedOilType} onValueChange={setSelectedOilType}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue placeholder="Select oil" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {oilTypes.map((oil) => (
                      <SelectItem key={oil.value} value={oil.value}>
                        {oil.emoji} {oil.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Oil Info */}
            <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">{selectedOil.emoji}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground">{selectedOil.label}</p>
                <p className="text-xs text-muted-foreground">₹{selectedOil.price}/L • Health Score: {selectedOil.healthScore}/100</p>
              </div>
              <Badge variant={selectedOil.healthScore >= 80 ? "default" : selectedOil.healthScore >= 60 ? "secondary" : "destructive"}>
                {selectedOil.healthScore >= 80 ? "Excellent" : selectedOil.healthScore >= 60 ? "Good" : "Poor"}
              </Badge>
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

            {/* Oil Comparison Tool */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Oil Comparison Tool</h2>
              </div>
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">Compare health benefits and costs of different oils</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={compareOils[0]} onValueChange={(v) => setCompareOils([v, compareOils[1]])}>
                      <SelectTrigger className="bg-secondary border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {oilTypes.map((oil) => (
                          <SelectItem key={oil.value} value={oil.value}>
                            {oil.emoji} {oil.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={compareOils[1]} onValueChange={(v) => setCompareOils([compareOils[0], v])}>
                      <SelectTrigger className="bg-secondary border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {oilTypes.map((oil) => (
                          <SelectItem key={oil.value} value={oil.value}>
                            {oil.emoji} {oil.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {compareOils.map((oilValue) => {
                      const oil = oilTypes.find(o => o.value === oilValue)!;
                      return (
                        <div key={oilValue} className="bg-secondary/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{oil.emoji}</span>
                            <span className="font-medium text-sm text-foreground">{oil.label}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Health Score</span>
                              <span className={oil.healthScore >= 80 ? "text-success font-medium" : oil.healthScore >= 60 ? "text-warning font-medium" : "text-destructive font-medium"}>
                                {oil.healthScore}/100
                              </span>
                            </div>
                            <Progress value={oil.healthScore} className="h-1.5" />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Price</span>
                            <span className="text-foreground font-medium">₹{oil.price}/L</span>
                          </div>
                          <div className="space-y-1">
                            {oil.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="text-success">✓</span>
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Smart Oil Budget Planner */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-warning" />
                <h2 className="text-lg font-semibold text-foreground">Smart Oil Budget Planner</h2>
              </div>
              <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-0">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Monthly Oil Needed</p>
                      <p className="text-xl font-bold text-foreground">{monthlyOilNeededLiters.toFixed(1)} L</p>
                      <p className="text-xs text-muted-foreground">After {targetReduction}% reduction</p>
                    </div>
                    <div className="bg-card/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Monthly Budget</p>
                      <p className="text-xl font-bold text-warning">₹{monthlyBudget}</p>
                      <p className="text-xs text-muted-foreground">For {selectedOil.label}</p>
                    </div>
                  </div>
                  <div className="bg-card/50 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">Budget Comparison by Oil Type</p>
                    <div className="space-y-2">
                      {oilTypes.slice(0, 5).map((oil) => {
                        const budget = Math.round(monthlyOilNeededLiters * oil.price);
                        const isSelected = oil.value === selectedOilType;
                        return (
                          <div key={oil.value} className={`flex items-center justify-between p-2 rounded-lg ${isSelected ? 'bg-primary/10' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span>{oil.emoji}</span>
                              <span className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-muted-foreground'}`}>{oil.label}</span>
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>₹{budget}/mo</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-success/10 rounded-lg p-3">
                    <Droplets className="w-4 h-4 text-success" />
                    <p className="text-sm text-success">
                      Switching to {oilTypes.find(o => o.healthScore === Math.max(...oilTypes.map(t => t.healthScore)))?.label} could improve your health score by up to {Math.max(...oilTypes.map(t => t.healthScore)) - selectedOil.healthScore} points!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Health Benefits */}
            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Benefits of {selectedOil.label}:</h3>
                <ul className="space-y-2">
                  {selectedOil.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {benefit}
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    Reduced risk of heart disease and obesity
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    Better cholesterol levels and blood pressure
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

      <BottomNav />
    </div>
  );
};

export default OilCalculator;
