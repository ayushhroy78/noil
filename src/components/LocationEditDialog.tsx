import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Pencil } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

interface LocationEditDialogProps {
  city: string | null;
  state: string | null;
  onLocationUpdate: (city: string | null, state: string | null) => void;
  children: React.ReactNode;
}

const LocationEditDialog = ({ city, state, onLocationUpdate, children }: LocationEditDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formCity, setFormCity] = useState(city || "");
  const [formState, setFormState] = useState(state || "");

  useEffect(() => {
    if (open) {
      setFormCity(city || "");
      setFormState(state || "");
    }
  }, [open, city, state]);

  const handleSave = async () => {
    if (!formState) {
      toast({
        title: "State required",
        description: "Please select your state",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          city: formCity.trim() || null,
          state: formState,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      onLocationUpdate(formCity.trim() || null, formState);
      toast({
        title: "Location updated",
        description: "Your location has been saved.",
      });
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Update Your Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-city">City / District</Label>
            <Input
              id="edit-city"
              placeholder="e.g., Koramangala, Andheri"
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-state">State *</Label>
            <Select value={formState} onValueChange={setFormState}>
              <SelectTrigger>
                <SelectValue placeholder="Select your state" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save Location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationEditDialog;
