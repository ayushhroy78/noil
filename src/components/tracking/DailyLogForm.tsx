import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailyLogFormProps {
  userId: string;
  onLogAdded: () => void;
}

export const DailyLogForm = ({ userId, onLogAdded }: DailyLogFormProps) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [oilType, setOilType] = useState("other");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const OIL_TYPES = [
    { value: "mustard", label: t('tracker.oilTypes.mustard') },
    { value: "groundnut", label: t('tracker.oilTypes.groundnut') },
    { value: "olive", label: t('tracker.oilTypes.olive') },
    { value: "coconut", label: t('tracker.oilTypes.coconut') },
    { value: "sunflower", label: t('tracker.oilTypes.sunflower') },
    { value: "sesame", label: t('tracker.oilTypes.sesame') },
    { value: "rice bran", label: t('tracker.oilTypes.riceBran') },
    { value: "refined", label: t('tracker.oilTypes.refined') },
    { value: "vegetable", label: t('tracker.oilTypes.vegetable') },
    { value: "other", label: t('tracker.oilTypes.other') },
  ];

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
        title: t('tracker.usageLogged'),
        description: `${amount} ${t('common.ml')} ${OIL_TYPES.find(o => o.value === oilType)?.label || oilType} ${t('tracker.usageLoggedDesc')}`,
      });

      setAmount("");
      setOilType("other");
      setNotes("");
      onLogAdded();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tracker.failedToLog'),
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
          {t('tracker.logDailyUsage')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('tracker.amountMl')}</Label>
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
              <Label htmlFor="oilType">{t('tracker.oilType')}</Label>
              <Select value={oilType} onValueChange={setOilType}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder={t('tracker.selectOilType')} />
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
            <Label htmlFor="notes">{t('tracker.notesOptional')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('tracker.notesPlaceholder')}
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
            {t('tracker.logUsage')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};