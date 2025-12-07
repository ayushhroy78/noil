import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Utensils, Droplet, Clock, Heart, Brain, X, Check } from "lucide-react";
import { toast } from "sonner";

interface ChallengeCheckInFormProps {
  onSubmit: (data: CheckInFormData) => Promise<any>;
  onUploadPhoto: (file: File) => Promise<string | null>;
  todayMeals: string[];
  dailyPrompt?: {
    id: string;
    prompt_text: string;
    user_response?: string | null;
  } | null;
  onAnswerPrompt?: (promptId: string, response: string) => void;
}

export interface CheckInFormData {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  oil_type?: string;
  oil_quantity_ml?: number;
  cooking_method?: string;
  ingredients_used?: string[];
  alternative_ingredients?: string[];
  cooking_notes?: string;
  energy_level?: number;
  mood?: string;
  cravings_notes?: string;
  photo_url?: string;
}

const OIL_TYPES = [
  "Mustard Oil",
  "Groundnut Oil",
  "Coconut Oil",
  "Sesame Oil",
  "Rice Bran Oil",
  "Olive Oil",
  "Sunflower Oil",
  "Refined Oil",
  "No Oil Used",
];

const COOKING_METHODS = [
  "Deep Frying",
  "Shallow Frying",
  "Sautéing",
  "Stir Frying",
  "Steaming",
  "Baking",
  "Grilling",
  "Boiling",
  "Air Frying",
  "Raw/No Cooking",
];

const MOOD_OPTIONS = [
  { value: "great", label: "😊 Great", color: "bg-success/20 text-success" },
  { value: "good", label: "🙂 Good", color: "bg-primary/20 text-primary" },
  { value: "neutral", label: "😐 Neutral", color: "bg-muted text-muted-foreground" },
  { value: "tired", label: "😴 Tired", color: "bg-warning/20 text-warning" },
  { value: "stressed", label: "😰 Stressed", color: "bg-destructive/20 text-destructive" },
];

export const ChallengeCheckInForm = ({
  onSubmit,
  onUploadPhoto,
  todayMeals,
  dailyPrompt,
  onAnswerPrompt,
}: ChallengeCheckInFormProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [promptResponse, setPromptResponse] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CheckInFormData>({
    meal_type: "lunch",
  });

  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [alternativeInput, setAlternativeInput] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    const url = await onUploadPhoto(file);
    if (url) {
      setFormData(prev => ({ ...prev, photo_url: url }));
      toast.success("Photo uploaded!");
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      const newIngredients = [...ingredients, ingredientInput.trim()];
      setIngredients(newIngredients);
      setFormData(prev => ({ ...prev, ingredients_used: newIngredients }));
      setIngredientInput("");
    }
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
    setFormData(prev => ({ ...prev, ingredients_used: newIngredients }));
  };

  const addAlternative = () => {
    if (alternativeInput.trim()) {
      const newAlternatives = [...alternatives, alternativeInput.trim()];
      setAlternatives(newAlternatives);
      setFormData(prev => ({ ...prev, alternative_ingredients: newAlternatives }));
      setAlternativeInput("");
    }
  };

  const handleSubmit = async () => {
    if (!formData.meal_type) {
      toast.error("Please select a meal type");
      return;
    }

    if (todayMeals.includes(formData.meal_type)) {
      toast.error(`You've already logged ${formData.meal_type} today`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Reset form
      setFormData({ meal_type: "lunch" });
      setPhotoPreview(null);
      setIngredients([]);
      setAlternatives([]);
      setStep(1);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableMeals = ["breakfast", "lunch", "dinner", "snack"].filter(
    m => !todayMeals.includes(m)
  );

  return (
    <Card className="shadow-soft border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary" />
          Daily Check-In
        </CardTitle>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Daily Prompt */}
        {dailyPrompt && !dailyPrompt.user_response && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary mb-2">
              📝 Today's Question:
            </p>
            <p className="text-sm text-foreground mb-3">{dailyPrompt.prompt_text}</p>
            <div className="flex gap-2">
              <Input
                placeholder="Your answer..."
                value={promptResponse}
                onChange={(e) => setPromptResponse(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (promptResponse && onAnswerPrompt) {
                    onAnswerPrompt(dailyPrompt.id, promptResponse);
                    setPromptResponse("");
                  }
                }}
                disabled={!promptResponse}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {/* Meal Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Meal Type
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {["breakfast", "lunch", "dinner", "snack"].map((meal) => {
                  const isLogged = todayMeals.includes(meal);
                  return (
                    <Button
                      key={meal}
                      type="button"
                      variant={formData.meal_type === meal ? "default" : "outline"}
                      size="sm"
                      disabled={isLogged}
                      onClick={() => setFormData(prev => ({ ...prev, meal_type: meal as any }))}
                      className={`capitalize ${isLogged ? "opacity-50" : ""}`}
                    >
                      {meal}
                      {isLogged && <Check className="w-3 h-3 ml-1" />}
                    </Button>
                  );
                })}
              </div>
              {todayMeals.length === 4 && (
                <p className="text-sm text-muted-foreground">
                  All meals logged for today! 🎉
                </p>
              )}
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Meal Photo (Recommended)
              </Label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Meal preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      setPhotoPreview(null);
                      setFormData(prev => ({ ...prev, photo_url: undefined }));
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Badge className="absolute bottom-2 left-2 bg-success/90">
                    +20 points
                  </Badge>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed flex flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Upload meal photo for verification
                  </span>
                </Button>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={() => setStep(2)}
              disabled={availableMeals.length === 0}
            >
              Next: Oil Details
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Oil Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                Oil Type Used
              </Label>
              <Select
                value={formData.oil_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, oil_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select oil type" />
                </SelectTrigger>
                <SelectContent>
                  {OIL_TYPES.map((oil) => (
                    <SelectItem key={oil} value={oil}>
                      {oil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Oil Quantity */}
            <div className="space-y-2">
              <Label>Oil Quantity (ml)</Label>
              <Input
                type="number"
                placeholder="e.g., 15"
                value={formData.oil_quantity_ml || ""}
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    oil_quantity_ml: parseFloat(e.target.value) || undefined 
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Tip: 1 tablespoon ≈ 15ml
              </p>
            </div>

            {/* Cooking Method */}
            <div className="space-y-2">
              <Label>Cooking Method</Label>
              <Select
                value={formData.cooking_method}
                onValueChange={(v) => setFormData(prev => ({ ...prev, cooking_method: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did you cook?" />
                </SelectTrigger>
                <SelectContent>
                  {COOKING_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next: Wellness
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {/* Ingredients */}
            <div className="space-y-2">
              <Label>Ingredients Used</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add ingredient..."
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                />
                <Button type="button" onClick={addIngredient} size="icon">
                  +
                </Button>
              </div>
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {ingredients.map((ing, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {ing}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeIngredient(i)} 
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Energy Level
              </Label>
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={formData.energy_level === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, energy_level: level }))}
                    className="w-10 h-10"
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                1 = Very Low, 5 = Very High
              </p>
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Current Mood
              </Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <Button
                    key={mood.value}
                    type="button"
                    variant={formData.mood === mood.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, mood: mood.value }))}
                    className={formData.mood === mood.value ? "" : mood.color}
                  >
                    {mood.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any cravings, observations, or notes..."
                value={formData.cooking_notes || ""}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, cooking_notes: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={isSubmitting || availableMeals.length === 0}
              >
                {isSubmitting ? "Saving..." : "Submit Check-In"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
