import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HouseholdSizePromptProps {
  userId: string;
  onComplete?: () => void;
}

export function HouseholdSizePrompt({ userId, onComplete }: HouseholdSizePromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [householdSize, setHouseholdSize] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkHouseholdSize = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("household_size")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking household size:", error);
        return;
      }

      // Show prompt if household_size is null or default (1) and has been a user for a while
      if (!data?.household_size || data.household_size === 1) {
        // Check if we've prompted before (using localStorage)
        const prompted = localStorage.getItem(`household_prompted_${userId}`);
        if (!prompted) {
          setIsOpen(true);
        }
      }
    };

    checkHouseholdSize();
  }, [userId]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ household_size: parseInt(householdSize) })
        .eq("user_id", userId);

      if (error) throw error;

      // Mark as prompted
      localStorage.setItem(`household_prompted_${userId}`, 'true');

      toast({
        title: "Household size updated",
        description: "This helps us provide more accurate insights for your family."
      });

      setIsOpen(false);
      onComplete?.();
    } catch (error) {
      console.error("Error updating household size:", error);
      toast({
        title: "Error",
        description: "Failed to update household size",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`household_prompted_${userId}`, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>How many people in your household?</DialogTitle>
              <DialogDescription className="mt-1">
                This helps us give you more accurate health insights and personalized recommendations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="household-size" className="text-sm font-medium">
            Household Size
          </Label>
          <Select value={householdSize} onValueChange={setHouseholdSize}>
            <SelectTrigger id="household-size" className="mt-2">
              <SelectValue placeholder="Select household size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 person (Just me)</SelectItem>
              <SelectItem value="2">2 people</SelectItem>
              <SelectItem value="3">3 people</SelectItem>
              <SelectItem value="4">4 people</SelectItem>
              <SelectItem value="5">5 people</SelectItem>
              <SelectItem value="6">6 people</SelectItem>
              <SelectItem value="7">7+ people</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Include everyone who shares meals cooked at home.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
