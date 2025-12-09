import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useHealthProfile, calculateRecommendedOil, HealthProfile } from "@/hooks/useHealthProfile";
import { User, Activity, Target, Heart, Scale, Ruler, Loader2, Sparkles } from "lucide-react";

interface HealthProfileFormProps {
  userId: string;
}

export const HealthProfileForm = ({ userId }: HealthProfileFormProps) => {
  const { t } = useTranslation();
  const { profile, profileLoading, updateProfile, isUpdating } = useHealthProfile(userId);
  
  const activityLevels = [
    { value: "sedentary", label: t("profile.sedentary"), description: t("profile.sedentaryDesc") },
    { value: "light", label: t("profile.lightlyActive"), description: t("profile.lightlyActiveDesc") },
    { value: "moderate", label: t("profile.moderatelyActive"), description: t("profile.moderatelyActiveDesc") },
    { value: "active", label: t("profile.active"), description: t("profile.activeDesc") },
    { value: "very_active", label: t("profile.veryActive"), description: t("profile.veryActiveDesc") },
  ];

  const genderOptions = [
    { value: "male", label: t("profile.male") },
    { value: "female", label: t("profile.female") },
    { value: "other", label: t("profile.other") },
  ];

  const [formData, setFormData] = useState<HealthProfile>({
    full_name: "",
    age: null,
    weight_kg: null,
    height_cm: null,
    gender: null,
    activity_level: "moderate",
    health_conditions: [],
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        age: profile.age,
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        gender: profile.gender,
        activity_level: profile.activity_level || "moderate",
        health_conditions: profile.health_conditions || [],
      });
    }
  }, [profile]);

  const recommendedOil = calculateRecommendedOil(
    formData.weight_kg,
    formData.activity_level,
    formData.age
  );

  const handleSave = () => {
    updateProfile(formData);
  };

  const getBMI = () => {
    if (formData.weight_kg && formData.height_cm) {
      const heightM = formData.height_cm / 100;
      return (formData.weight_kg / (heightM * heightM)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: t("profile.underweight"), color: "text-yellow-600" };
    if (bmi < 25) return { label: t("profile.normal"), color: "text-green-600" };
    if (bmi < 30) return { label: t("profile.overweight"), color: "text-orange-600" };
    return { label: t("profile.obese"), color: "text-red-600" };
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const bmi = getBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="space-y-6">
      {/* Personalized Recommendation Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Target className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {t("profile.dailyOilRecommendation")}
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {t("profile.basedOnProfile")}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{recommendedOil}</span>
                <span className="text-lg text-muted-foreground">{t("profile.mlPerDay")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("profile.icmrRecommends")}
              </p>
            </div>
          </div>
          
          {bmi && bmiInfo && (
            <div className="mt-4 p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("profile.yourBMI")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{bmi}</span>
                  <Badge variant="outline" className={bmiInfo.color}>
                    {bmiInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-primary" />
            {t("profile.personalInfo")}
          </CardTitle>
          <CardDescription>
            {t("profile.basicHealthMetrics")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("profile.fullName")}</Label>
            <Input
              id="full_name"
              placeholder={t("profile.enterName")}
              value={formData.full_name || ""}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">{t("profile.age")}</Label>
              <Input
                id="age"
                type="number"
                placeholder={t("profile.years")}
                value={formData.age || ""}
                onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">{t("profile.gender")}</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t("profile.select")} />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                {t("profile.weight")} ({t("profile.kg")})
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder={t("profile.kg")}
                value={formData.weight_kg || ""}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {t("profile.height")} ({t("profile.cm")})
              </Label>
              <Input
                id="height"
                type="number"
                placeholder={t("profile.cm")}
                value={formData.height_cm || ""}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {t("profile.activityLevel")}
            </Label>
            <Select
              value={formData.activity_level || "moderate"}
              onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("profile.select")} />
              </SelectTrigger>
              <SelectContent>
                {activityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex flex-col">
                      <span>{level.label}</span>
                      <span className="text-xs text-muted-foreground">{level.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full" 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("profile.saveProfile")
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Health Tips */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">{t("profile.healthTip")}</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {t("profile.healthTipText")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};