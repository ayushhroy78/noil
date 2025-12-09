import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Utensils, Droplet, Clock, Heart, Brain, X, Check, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChallengeTokenDisplay } from "./ChallengeTokenDisplay";

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
  challengeId?: string;
  userChallengeId?: string;
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
  verified_with_token?: boolean;
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
  challengeId,
  userChallengeId,
}: ChallengeCheckInFormProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [promptResponse, setPromptResponse] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Token verification state
  const [showTokenScreen, setShowTokenScreen] = useState(false);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [enteredToken, setEnteredToken] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CheckInFormData>({
    meal_type: "lunch",
  });

  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [alternativeInput, setAlternativeInput] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const handleStartPhotoFlow = () => {
    if (challengeId && userChallengeId) {
      setShowTokenScreen(true);
    } else {
      // Fallback for challenges without token system
      fileInputRef.current?.click();
    }
  };

  const handleTokenProceed = (token: string) => {
    setActiveToken(token);
    setShowTokenScreen(false);
    // Now show file picker
    fileInputRef.current?.click();
  };

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

  const validateToken = async () => {
    if (!challengeId || !enteredToken.trim()) {
      setTokenError("Please enter the verification code");
      return false;
    }

    setIsValidatingToken(true);
    setTokenError(null);

    try {
      const { data, error } = await supabase.functions.invoke("validate-challenge-token", {
        body: {
          challenge_id: challengeId,
          entered_token: enteredToken.trim(),
        },
      });

      if (error) throw error;

      if (data.valid) {
        setTokenValidated(true);
        toast.success("Verification successful! +30 bonus points");
        return true;
      } else {
        setTokenError(data.error || "Invalid verification code");
        return false;
      }
    } catch (error: any) {
      console.error("Token validation error:", error);
      setTokenError("Failed to validate code. Please try again.");
      return false;
    } finally {
      setIsValidatingToken(false);
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

    // If photo was uploaded with token flow, validate token first
    if (activeToken && formData.photo_url && !tokenValidated) {
      const isValid = await validateToken();
      if (!isValid) {
        toast.error("Please verify your photo with the correct code");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        verified_with_token: tokenValidated,
      });
      
      // Reset form
      setFormData({ meal_type: "lunch" });
      setPhotoPreview(null);
      setIngredients([]);
      setAlternatives([]);
      setStep(1);
      setActiveToken(null);
      setEnteredToken("");
      setTokenValidated(false);
      setTokenError(null);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableMeals = ["breakfast", "lunch", "dinner", "snack"].filter(
    m => !todayMeals.includes(m)
  );

  // Show token screen
  if (showTokenScreen && challengeId && userChallengeId) {
    return (
      <ChallengeTokenDisplay
        challengeId={challengeId}
        userChallengeId={userChallengeId}
        onProceed={handleTokenProceed}
        onCancel={() => setShowTokenScreen(false)}
      />
    );
  }

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
                Meal Photo (Verified)
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
                      setActiveToken(null);
                      setEnteredToken("");
                      setTokenValidated(false);
                      setTokenError(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {tokenValidated ? (
                    <Badge className="absolute bottom-2 left-2 bg-success/90 gap-1">
                      <Shield className="w-3 h-3" />
                      Verified +30 pts
                    </Badge>
                  ) : activeToken ? (
                    <Badge className="absolute bottom-2 left-2 bg-warning/90 gap-1">
                      <Shield className="w-3 h-3" />
                      Pending verification
                    </Badge>
                  ) : (
                    <Badge className="absolute bottom-2 left-2 bg-success/90">
                      +20 points
                    </Badge>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed flex flex-col gap-2"
                  onClick={handleStartPhotoFlow}
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {challengeId ? "Upload verified meal photo" : "Upload meal photo for verification"}
                  </span>
                  {challengeId && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="w-3 h-3" />
                      Anti-cheat protected
                    </Badge>
                  )}
                </Button>
              )}

              {/* Token Entry (if photo uploaded with token flow) */}
              {activeToken && photoPreview && !tokenValidated && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="w-4 h-4 text-primary" />
                    Enter verification code from your photo
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type the code you wrote on paper (e.g., {activeToken})
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., NOIL-1234"
                      value={enteredToken}
                      onChange={(e) => {
                        setEnteredToken(e.target.value.toUpperCase());
                        setTokenError(null);
                      }}
                      className={`font-mono ${tokenError ? "border-destructive" : ""}`}
                    />
                    <Button
                      onClick={validateToken}
                      disabled={isValidatingToken || !enteredToken.trim()}
                    >
                      {isValidatingToken ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                  {tokenError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {tokenError}
                    </div>
                  )}
                </div>
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
