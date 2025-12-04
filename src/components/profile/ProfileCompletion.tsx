import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Scale, Ruler, Activity, Heart } from "lucide-react";
import logoImg from "@/assets/logo.jpg";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const REGIONS = [
  { value: "north", label: "North India" },
  { value: "south", label: "South India" },
  { value: "east", label: "East India" },
  { value: "west", label: "West India" },
  { value: "central", label: "Central India" },
  { value: "northeast", label: "Northeast India" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (Little/no exercise)" },
  { value: "light", label: "Light (Exercise 1-3 days/week)" },
  { value: "moderate", label: "Moderate (Exercise 3-5 days/week)" },
  { value: "active", label: "Active (Exercise 6-7 days/week)" },
  { value: "very_active", label: "Very Active (Intense exercise daily)" },
];

interface ProfileCompletionProps {
  userId: string;
  onComplete: () => void;
}

const ProfileCompletion = ({ userId, onComplete }: ProfileCompletionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "moderate",
    state: "",
    region: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: formData.full_name || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          activity_level: formData.activity_level,
          state: formData.state || null,
          region: formData.region || null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Profile Complete!",
        description: "Your profile has been set up successfully.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.full_name.trim().length > 0;
    if (step === 2) return formData.state.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center space-y-4">
          <img src={logoImg} alt="Noil Logo" className="h-12 w-12 mx-auto object-contain" />
          <div>
            <CardTitle className="text-xl font-bold text-primary">Complete Your Profile</CardTitle>
            <CardDescription>Help us personalize your experience</CardDescription>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <User className="w-5 h-5" />
                <span className="font-medium">Basic Information</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Enter your name"
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Years"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">Your Location</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(v) => handleChange("state", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region} onValueChange={(v) => handleChange("region", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This helps us show regional oil consumption patterns and personalized recommendations.
              </p>
            </div>
          )}

          {/* Step 3: Health Info */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Heart className="w-5 h-5" />
                <span className="font-medium">Health Information</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height_cm" className="flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    Height (cm)
                  </Label>
                  <Input
                    id="height_cm"
                    type="number"
                    placeholder="170"
                    value={formData.height_cm}
                    onChange={(e) => handleChange("height_cm", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight_kg" className="flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    placeholder="70"
                    value={formData.weight_kg}
                    onChange={(e) => handleChange("weight_kg", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="activity_level" className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Activity Level
                </Label>
                <Select
                  value={formData.activity_level}
                  onValueChange={(v) => handleChange("activity_level", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            
            {step < 3 ? (
              <Button
                className="flex-1"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            )}
          </div>
          
          {/* Skip Option */}
          {step === 3 && (
            <button
              onClick={onComplete}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletion;
