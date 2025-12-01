import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wine, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BottleTrackingProps {
  userId: string;
  onBottleAdded: () => void;
}

export const BottleTracking = ({ userId, onBottleAdded }: BottleTrackingProps) => {
  const [brand, setBrand] = useState("");
  const [oilType, setOilType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [finishDate, setFinishDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !oilType || !quantity || !startDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate days used and average daily consumption if finish date is provided
      let daysUsed = null;
      let avgDailyConsumption = null;
      
      if (finishDate && startDate) {
        const diffTime = finishDate.getTime() - startDate.getTime();
        daysUsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysUsed > 0) {
          avgDailyConsumption = parseFloat(quantity) / daysUsed;
        }
      }

      const { error } = await supabase.from("bottles").insert({
        user_id: userId,
        brand,
        oil_type: oilType,
        quantity_ml: parseFloat(quantity),
        start_date: startDate.toISOString(),
        finish_date: finishDate ? finishDate.toISOString() : null,
        days_used: daysUsed,
        avg_daily_consumption: avgDailyConsumption,
      });

      if (error) throw error;

      toast({
        title: "Bottle added",
        description: finishDate 
          ? `Bottle logged with ${daysUsed} days of usage (${avgDailyConsumption?.toFixed(1)}ml/day average).`
          : "Your oil bottle has been logged successfully.",
      });

      // Reset form
      setBrand("");
      setOilType("");
      setQuantity("");
      setStartDate(new Date());
      setFinishDate(undefined);
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
            <Label htmlFor="brand">Brand Name *</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Fortune, Sundrop"
              className="bg-background border-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="oilType">Oil Type *</Label>
            <Input
              id="oilType"
              value={oilType}
              onChange={(e) => setOilType(e.target.value)}
              placeholder="e.g., Mustard, Groundnut, Sunflower"
              className="bg-background border-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (ml) *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 1000"
              className="bg-background border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Finish Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !finishDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {finishDate ? format(finishDate, "PP") : "Optional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={finishDate}
                    onSelect={setFinishDate}
                    initialFocus
                    disabled={(date) => 
                      date > new Date() || (startDate ? date < startDate : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {finishDate && startDate && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Duration: <span className="font-semibold text-foreground">
                  {Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
                {quantity && (
                  <>
                    {" • "}Average: <span className="font-semibold text-foreground">
                      {(parseFloat(quantity) / Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))).toFixed(1)} ml/day
                    </span>
                  </>
                )}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            <Wine className="w-4 h-4 mr-2" />
            {isSubmitting ? "Logging..." : "Log Bottle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
