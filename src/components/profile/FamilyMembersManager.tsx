import { useState } from "react";
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

const relationshipOptions = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "grandparent", label: "Grandparent" },
  { value: "other", label: "Other" },
];

const activityLevels = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly Active" },
  { value: "moderate", label: "Moderately Active" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
];

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

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
  const { familyMembers, isLoading, addMember, updateMember, deleteMember, isAdding, isUpdating } = useFamilyMembers(userId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(emptyFormData);

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

    // Calculate recommended oil if not manually set
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
    if (window.confirm("Are you sure you want to remove this family member?")) {
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
                  <h3 className="font-semibold">Household Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {familyMembers.length} family member{familyMembers.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Daily Goal</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalHouseholdGoal} ml
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
              Family Members
            </CardTitle>
            <CardDescription>
              Track oil consumption for your household
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Family Member" : "Add Family Member"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select
                      value={formData.relationship || ""}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                    >
                      <SelectTrigger id="relationship">
                        <SelectValue placeholder="Select" />
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
                    <Label htmlFor="member-age">Age</Label>
                    <Input
                      id="member-age"
                      type="number"
                      placeholder="Years"
                      value={formData.age || ""}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-weight">Weight (kg)</Label>
                    <Input
                      id="member-weight"
                      type="number"
                      placeholder="kg"
                      value={formData.weight_kg || ""}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-height">Height (cm)</Label>
                    <Input
                      id="member-height"
                      type="number"
                      placeholder="cm"
                      value={formData.height_cm || ""}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-gender">Gender</Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger id="member-gender">
                        <SelectValue placeholder="Select" />
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
                    <Label htmlFor="member-activity">Activity Level</Label>
                    <Select
                      value={formData.activity_level || "moderate"}
                      onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
                    >
                      <SelectTrigger id="member-activity">
                        <SelectValue placeholder="Select" />
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
                    Daily Oil Goal (ml)
                  </Label>
                  <Input
                    id="daily-goal"
                    type="number"
                    placeholder="Auto-calculated if empty"
                    value={formData.daily_oil_goal_ml || ""}
                    onChange={(e) => setFormData({ ...formData, daily_oil_goal_ml: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-calculate based on weight and activity
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
                      Saving...
                    </>
                  ) : editingMember ? (
                    "Update Member"
                  ) : (
                    "Add Member"
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
              <p className="text-muted-foreground">No family members added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add family members to track their oil consumption
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
                        {member.age && <span>{member.age} yrs</span>}
                        {member.weight_kg && (
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            {member.weight_kg} kg
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Target className="h-3 w-3" />
                          {member.daily_oil_goal_ml || 20} ml/day
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
