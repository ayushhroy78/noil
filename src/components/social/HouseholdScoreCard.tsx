import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, TrendingUp, TrendingDown, Minus, Share2, Download, Users } from 'lucide-react';
import { useHouseholdScore } from '@/hooks/useHouseholdScore';
import { shareImage, downloadImage } from '@/lib/imageExport';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { HOUSEHOLD_GRADES } from '@/lib/milestoneConfig';

interface HouseholdScoreCardProps {
  showShareButtons?: boolean;
  compact?: boolean;
}

export const HouseholdScoreCard: React.FC<HouseholdScoreCardProps> = ({
  showShareButtons = true,
  compact = false,
}) => {
  const { data: score, isLoading } = useHouseholdScore();
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (isLoading) {
    return <Skeleton className={compact ? "h-16" : "h-40"} />;
  }

  if (!score) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <Home className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Start tracking to see your household score</p>
      </Card>
    );
  }

  const TrendIcon = score.trend === 'down' 
    ? TrendingDown 
    : score.trend === 'up' 
      ? TrendingUp 
      : Minus;

  const trendColor = score.trend === 'down' 
    ? 'text-green-500' 
    : score.trend === 'up' 
      ? 'text-red-500' 
      : 'text-yellow-500';

  const gradeColorClass = HOUSEHOLD_GRADES[score.grade].color;

  const handleShare = async () => {
    if (!cardRef.current) return;
    const success = await shareImage(
      cardRef.current,
      'Household Health Score',
      `Our family scored ${score.grade}! 🏠`
    );
    if (success) {
      toast({ title: "Ready to share!" });
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    await downloadImage(cardRef.current, 'noil-household-score.png');
    toast({ title: "Downloaded!" });
  };

  if (compact) {
    return (
      <Card className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Household: {score.grade}</p>
          <p className="text-xs text-muted-foreground">{score.gradeLabel}</p>
        </div>
        <TrendIcon className={`w-4 h-4 ${trendColor}`} />
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 p-6 text-white shadow-lg"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5" />
            <span className="text-sm opacity-90">Healthy Household Score</span>
          </div>
          
          <div className="text-5xl font-bold mb-2">
            {score.grade}
          </div>
          <p className="text-lg font-medium opacity-90 mb-4">{score.gradeLabel}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-4 h-4" />
                <span>Family of {score.householdSize}</span>
              </div>
              <div className="text-lg font-bold">{score.avgOilPerPerson} ml</div>
              <div className="text-xs opacity-75">per person/day</div>
            </div>
            
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendIcon className="w-4 h-4" />
                <span className="capitalize">This Month</span>
              </div>
              <div className="text-lg font-bold">
                {score.trend === 'down' ? '-' : score.trend === 'up' ? '+' : ''}{score.improvementPercent}%
              </div>
              <div className="text-xs opacity-75">
                {score.trend === 'down' ? 'Improved!' : score.trend === 'up' ? 'Needs work' : 'Stable'}
              </div>
            </div>
          </div>
          
          <p className="text-xs opacity-60 mt-4">Created with NOIL</p>
        </div>
      </div>
      
      {showShareButtons && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
