import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailyLogFormProps {
  userId: string;
  onLogAdded: () => void;
}

export const DailyLogForm = ({ userId, onLogAdded }: DailyLogFormProps) => {
  const [amount, setAmount] = useState("");
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
        source: "manual",
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Usage logged",
        description: "Daily oil usage has been recorded.",
      });

      setAmount("");
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
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Used (ml)</Label>
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
