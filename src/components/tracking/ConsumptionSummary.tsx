import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropletIcon, TrendingUp, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConsumptionData {
  today: number;
  weekly: number;
  monthly: number;
  cookingOil: number;
  bottleOil: number;
  hiddenOil: number;
}

interface ConsumptionSummaryProps {
  data: ConsumptionData;
}

export const ConsumptionSummary = ({ data }: ConsumptionSummaryProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Card className="border-border/40 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DropletIcon className="w-5 h-5 text-primary" />
            {t('tracker.totalConsumption')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-card rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">{t('common.today')}</p>
              <p className="text-2xl font-bold text-foreground">{data.today} {t('common.ml')}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {t('common.daily')}
            </Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-card rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">{t('common.thisWeek')}</p>
              <p className="text-xl font-semibold text-foreground">{data.weekly} {t('common.ml')}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="flex justify-between items-center p-3 bg-card rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">{t('common.thisMonth')}</p>
              <p className="text-xl font-semibold text-foreground">{data.monthly} {t('common.ml')}</p>
            </div>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('tracker.consumptionBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">{t('tracker.cookingOil')}</span>
            <span className="font-semibold text-foreground">{data.cookingOil} {t('common.ml')}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">{t('tracker.hiddenOilPackaged')}</span>
            <span className="font-semibold text-foreground">{data.hiddenOil} {t('common.ml')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};