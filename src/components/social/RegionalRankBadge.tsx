import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingUp, TrendingDown, Minus, Share2, Download } from 'lucide-react';
import { useRegionalRanking } from '@/hooks/useRegionalRanking';
import { shareImage, downloadImage } from '@/lib/imageExport';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface RegionalRankBadgeProps {
  showShareButtons?: boolean;
  compact?: boolean;
}

export const RegionalRankBadge: React.FC<RegionalRankBadgeProps> = ({
  showShareButtons = true,
  compact = false,
}) => {
  const { data: ranking, isLoading } = useRegionalRanking();
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (isLoading) {
    return <Skeleton className={compact ? "h-16" : "h-32"} />;
  }

  if (!ranking) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Set your location to see regional ranking</p>
      </Card>
    );
  }

  const TrendIcon = ranking.regionTrend === 'improving' 
    ? TrendingDown 
    : ranking.regionTrend === 'worsening' 
      ? TrendingUp 
      : Minus;

  const trendColor = ranking.regionTrend === 'improving' 
    ? 'text-green-500' 
    : ranking.regionTrend === 'worsening' 
      ? 'text-red-500' 
      : 'text-yellow-500';

  const handleShare = async () => {
    if (!cardRef.current) return;
    const success = await shareImage(
      cardRef.current,
      'My Regional Ranking',
      `I'm in the top ${ranking.rankPercent}% in ${ranking.regionLabel}! 🌟`
    );
    if (success) {
      toast({ title: "Ready to share!" });
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    await downloadImage(cardRef.current, 'noil-regional-rank.png');
    toast({ title: "Downloaded!" });
  };

  if (compact) {
    return (
      <Card className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Top {ranking.rankPercent}%</p>
          <p className="text-xs text-muted-foreground truncate">{ranking.regionLabel}</p>
        </div>
        <TrendIcon className={`w-4 h-4 ${trendColor}`} />
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 text-white shadow-lg"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-sm opacity-90">{ranking.regionLabel}</span>
          </div>
          
          <div className="text-4xl font-bold mb-2">
            Top {ranking.rankPercent}%
          </div>
          
          <p className="text-sm opacity-90 mb-4">
            You're helping your region move towards healthier oil usage!
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrendIcon className="w-4 h-4" />
              <span className="capitalize">{ranking.regionTrend}</span>
            </div>
            <div>
              {ranking.totalUsersInRegion} users in region
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
