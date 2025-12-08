import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailyLogFormProps {
  userId: string;
  onLogAdded: () => void;
}

const OIL_TYPES = [
  { value: "mustard", label: "Mustard Oil" },
  { value: "groundnut", label: "Groundnut Oil" },
  { value: "olive", label: "Olive Oil" },
  { value: "coconut", label: "Coconut Oil" },
  { value: "sunflower", label: "Sunflower Oil" },
  { value: "sesame", label: "Sesame Oil" },
  { value: "rice bran", label: "Rice Bran Oil" },
  { value: "refined", label: "Refined Oil" },
  { value: "vegetable", label: "Vegetable Oil" },
  { value: "other", label: "Other" },
];

export const DailyLogForm = ({ userId, onLogAdded }: DailyLogFormProps) => {
  const [amount, setAmount] = useState("");
  const [oilType, setOilType] = useState("other");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("daily_logs").insert({
        user_id: userId,
        amount_ml: parseFloat(amount),
        oil_type: oilType,
        source: "manual",
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Usage logged",
        description: `${amount} ml of ${OIL_TYPES.find(o => o.value === oilType)?.label || oilType} recorded.`,
      });

      setAmount("");
      setOilType("other");
      setNotes("");
      onLogAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log usage. Please try again.",
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
          <Clock className="w-5 h-5 text-primary" />
          Log Daily Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ml)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 50"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oilType">Oil Type</Label>
              <Select value={oilType} onValueChange={setOilType}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select oil type" />
                </SelectTrigger>
                <SelectContent>
                  {OIL_TYPES.map((oil) => (
                    <SelectItem key={oil.value} value={oil.value}>
                      {oil.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deep frying, regular cooking"
              className="bg-background border-border resize-none"
              rows={2}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            <Clock className="w-4 h-4 mr-2" />
            Log Usage
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
