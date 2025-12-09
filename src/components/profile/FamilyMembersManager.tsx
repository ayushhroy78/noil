import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useFamilyMembers, FamilyMember, calculateRecommendedOil } from "@/hooks/useHealthProfile";
import { Users, Plus, Edit2, Trash2, Loader2, User, Target, Scale } from "lucide-react";

interface FamilyMembersManagerProps {
  userId: string;
}

interface MemberFormData {
  name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: string | null;
  activity_level: string | null;
  daily_oil_goal_ml: number | null;
  relationship: string | null;
}

const emptyFormData: MemberFormData = {
  name: "",
  age: null,
  weight_kg: null,
  height_cm: null,
  gender: null,
  activity_level: "moderate",
  daily_oil_goal_ml: 20,
  relationship: null,
};

export const FamilyMembersManager = ({ userId }: FamilyMembersManagerProps) => {
  const { t } = useTranslation();
  const { familyMembers, isLoading, addMember, updateMember, deleteMember, isAdding, isUpdating } = useFamilyMembers(userId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(emptyFormData);

  const relationshipOptions = [
    { value: "spouse", label: t("profile.spouse") },
    { value: "child", label: t("profile.child") },
    { value: "parent", label: t("profile.parent") },
    { value: "sibling", label: t("profile.sibling") },
    { value: "grandparent", label: t("profile.grandparent") },
    { value: "other", label: t("profile.other") },
  ];

  const activityLevels = [
    { value: "sedentary", label: t("profile.sedentary") },
    { value: "light", label: t("profile.lightlyActive") },
    { value: "moderate", label: t("profile.moderatelyActive") },
    { value: "active", label: t("profile.active") },
    { value: "very_active", label: t("profile.veryActive") },
  ];

  const genderOptions = [
    { value: "male", label: t("profile.male") },
    { value: "female", label: t("profile.female") },
    { value: "other", label: t("profile.other") },
  ];

  const handleOpenDialog = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        age: member.age,
        weight_kg: member.weight_kg,
        height_cm: member.height_cm,
        gender: member.gender,
        activity_level: member.activity_level,
        daily_oil_goal_ml: member.daily_oil_goal_ml,
        relationship: member.relationship,
      });
    } else {
      setEditingMember(null);
      setFormData(emptyFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const recommendedOil = calculateRecommendedOil(
      formData.weight_kg,
      formData.activity_level,
      formData.age
    );

    const memberData = {
      ...formData,
      daily_oil_goal_ml: formData.daily_oil_goal_ml || recommendedOil,
    };

    if (editingMember) {
      updateMember({ id: editingMember.id, ...memberData });
    } else {
      addMember(memberData);
    }
    setIsDialogOpen(false);
    setFormData(emptyFormData);
    setEditingMember(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t("profile.confirmDelete"))) {
      deleteMember(id);
    }
  };

  const totalHouseholdGoal = familyMembers.reduce(
    (sum, member) => sum + (member.daily_oil_goal_ml || 20),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Household Summary */}
      {familyMembers.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("profile.householdSummary")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {familyMembers.length} {familyMembers.length !== 1 ? t("profile.familyMembersPlural") : t("profile.familyMember")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t("profile.totalDailyGoal")}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalHouseholdGoal} {t("common.ml")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family Members List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              {t("profile.familyMembers")}
            </CardTitle>
            <CardDescription>
              {t("profile.trackOilConsumption")}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                {t("common.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? t("profile.editFamilyMember") : t("profile.addFamilyMember")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("profile.fullName")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("profile.enterName")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="relationship">{t("profile.relationship")}</Label>
                    <Select
                      value={formData.relationship || ""}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                    >
                      <SelectTrigger id="relationship">
                        <SelectValue placeholder={t("profile.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-age">{t("profile.age")}</Label>
                    <Input
                      id="member-age"
                      type="number"
                      placeholder={t("profile.years")}
                      value={formData.age || ""}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-weight">{t("profile.weight")} ({t("profile.kg")})</Label>
                    <Input
                      id="member-weight"
                      type="number"
                      placeholder={t("profile.kg")}
                      value={formData.weight_kg || ""}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-height">{t("profile.height")} ({t("profile.cm")})</Label>
                    <Input
                      id="member-height"
                      type="number"
                      placeholder={t("profile.cm")}
                      value={formData.height_cm || ""}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-gender">{t("profile.gender")}</Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger id="member-gender">
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
                  <div className="space-y-2">
                    <Label htmlFor="member-activity">{t("profile.activityLevel")}</Label>
                    <Select
                      value={formData.activity_level || "moderate"}
                      onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
                    >
                      <SelectTrigger id="member-activity">
                        <SelectValue placeholder={t("profile.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {activityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily-goal" className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {t("profile.dailyOilGoal")}
                  </Label>
                  <Input
                    id="daily-goal"
                    type="number"
                    placeholder={t("profile.autoCalculated")}
                    value={formData.daily_oil_goal_ml || ""}
                    onChange={(e) => setFormData({ ...formData, daily_oil_goal_ml: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("profile.leaveEmptyToCalc")}
                  </p>
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full"
                  disabled={!formData.name.trim() || isAdding || isUpdating}
                >
                  {(isAdding || isUpdating) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : editingMember ? (
                    t("profile.updateMember")
                  ) : (
                    t("profile.addMember")
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {familyMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{t("profile.noFamilyMembers")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("profile.addFamilyMembersDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {member.relationship && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {member.relationship}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {member.age && <span>{member.age} {t("common.yrs")}</span>}
                        {member.weight_kg && (
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            {member.weight_kg} {t("profile.kg")}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Target className="h-3 w-3" />
                          {member.daily_oil_goal_ml || 20} {t("common.ml")}/{t("common.daily").toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(member)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};