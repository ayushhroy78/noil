import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RegionSelectorProps {
  userId: string | undefined;
  onRegionChange: (region: string | null) => void;
}

const REGIONS = [
  { value: "North", label: "North India" },
  { value: "South", label: "South India" },
  { value: "East", label: "East India" },
  { value: "West", label: "West India" },
  { value: "Central", label: "Central India" },
  { value: "Coastal", label: "Coastal Regions" },
];

export const RegionSelector = ({ userId, onRegionChange }: RegionSelectorProps) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserRegion();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchUserRegion = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("region")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.region) {
        setSelectedRegion(data.region);
        onRegionChange(data.region);
      }
    } catch (error) {
      console.error("Error fetching region:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveRegion = async (region: string) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your region preference",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            region,
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;

      setSelectedRegion(region);
      onRegionChange(region);

      toast({
        title: "Region Saved",
        description: "Your region preference has been updated",
      });
    } catch (error) {
      console.error("Error saving region:", error);
      toast({
        title: "Error",
        description: "Failed to save region preference",
        variant: "destructive",
      });
    }
  };

  if (loading) return null;

  if (selectedRegion) {
    return (
      <div className="flex items-center justify-between mb-4 p-3 bg-secondary rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {REGIONS.find((r) => r.value === selectedRegion)?.label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRegion(null);
            onRegionChange(null);
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-4 mb-6 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Select Your Region</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Get personalized oil recommendations based on your location
      </p>
      <div className="grid grid-cols-2 gap-2">
        {REGIONS.map((region) => (
          <Button
            key={region.value}
            variant="outline"
            size="sm"
            onClick={() => saveRegion(region.value)}
            className="justify-start"
          >
            {region.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};