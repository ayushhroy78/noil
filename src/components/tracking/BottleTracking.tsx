import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BottleTrackingProps {
  userId: string;
  onBottleAdded: () => void;
}

export const BottleTracking = ({ userId, onBottleAdded }: BottleTrackingProps) => {
  const [brand, setBrand] = useState("");
  const [oilType, setOilType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !oilType || !quantity) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("bottles").insert({
        user_id: userId,
        brand,
        oil_type: oilType,
        quantity_ml: parseFloat(quantity),
      });

      if (error) throw error;

      toast({
        title: "Bottle added",
        description: "Your oil bottle has been logged successfully.",
      });

      setBrand("");
      setOilType("");
      setQuantity("");
      onBottleAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bottle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wine className="w-5 h-5 text-primary" />
          Add New Bottle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand Name</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Fortune, Sundrop"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oilType">Oil Type</Label>
            <Input
              id="oilType"
              value={oilType}
              onChange={(e) => setOilType(e.target.value)}
              placeholder="e.g., Mustard, Groundnut"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (ml)</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 1000"
              className="bg-background border-border"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            <Wine className="w-4 h-4 mr-2" />
            Log Bottle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
