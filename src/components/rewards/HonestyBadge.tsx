import { Shield, ShieldCheck, ShieldAlert, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useHabitIntegrity } from "@/hooks/useHabitIntegrity";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface HonestyBadgeProps {
  userId: string;
  variant?: 'compact' | 'full';
  showNudge?: boolean;
}

export function HonestyBadge({ userId, variant = 'compact', showNudge = true }: HonestyBadgeProps) {
  const { 
    habitIntegrity, 
    isLoading, 
    getGovernance, 
    computeHSS, 
    isComputing,
    needsRecomputation 
  } = useHabitIntegrity(userId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const governance = getGovernance();
  const score = habitIntegrity?.habit_stability_score ?? 50;
  const level = habitIntegrity?.honesty_level ?? 'medium';

  const getLevelConfig = () => {
    switch (level) {
      case 'high':
        return {
          icon: ShieldCheck,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          badgeVariant: 'default' as const,
          label: 'High Reliability',
          description: 'Your logging patterns are consistent and reliable'
        };
      case 'low':
        return {
          icon: ShieldAlert,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          borderColor: 'border-amber-200 dark:border-amber-800',
          badgeVariant: 'secondary' as const,
          label: 'Needs Improvement',
          description: 'Consistent logging helps unlock better rewards'
        };
      default:
        return {
          icon: Shield,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badgeVariant: 'outline' as const,
          label: 'Moderate',
          description: 'Keep logging regularly to improve your score'
        };
    }
  };

  const config = getLevelConfig();
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.borderColor} border cursor-help`}>
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              <span className={`text-xs font-medium ${config.color}`}>
                {level === 'high' ? 'Honest Logger' : level === 'low' ? 'Check Logs' : 'Regular'}
              </span>
              {level === 'high' && governance.boostMessage && (
                <TrendingUp className="h-3 w-3 text-green-600" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{config.label}</p>
              <p className="text-sm text-muted-foreground">{config.description}</p>
              {level === 'high' && (
                <p className="text-sm text-green-600 font-medium">+20% bonus on all rewards!</p>
              )}
              {level === 'low' && governance.nudgeMessage && (
                <p className="text-sm text-amber-600">{governance.nudgeMessage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Score: {score}/100</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant
  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <CardTitle className="text-base">{config.label}</CardTitle>
          </div>
          {level === 'high' && (
            <Badge className="bg-green-600 hover:bg-green-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              +20% Boost
            </Badge>
          )}
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Logging Reliability</span>
            <span className={`font-medium ${config.color}`}>{score}/100</span>
          </div>
          <Progress 
            value={score} 
            className={`h-2 ${level === 'high' ? '[&>div]:bg-green-600' : level === 'low' ? '[&>div]:bg-amber-600' : ''}`} 
          />
        </div>

        {governance.boostMessage && level === 'high' && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{governance.boostMessage}</p>
          </div>
        )}

        {showNudge && governance.nudgeMessage && level !== 'high' && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{governance.nudgeMessage}</p>
          </div>
        )}

        {level !== 'high' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Info className="h-3 w-3" />
              Tips to improve:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Log your oil usage daily</li>
              <li>Enter realistic values matching your household</li>
              <li>Avoid bulk editing past entries</li>
              <li>Keep natural variation in your logs</li>
            </ul>
          </div>
        )}

        {needsRecomputation() && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => computeHSS()}
            disabled={isComputing}
            className="w-full"
          >
            {isComputing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Refresh Score'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
