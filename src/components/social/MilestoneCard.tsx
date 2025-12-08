import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download } from 'lucide-react';
import { getMilestoneIcon, getMilestoneGradient } from '@/lib/milestoneConfig';
import { shareImage, downloadImage } from '@/lib/imageExport';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MilestoneCardProps {
  title: string;
  description: string;
  type: string;
  icon?: string | null;
  achievedAt?: string;
  meta?: Record<string, any>;
  compact?: boolean;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  title,
  description,
  type,
  icon,
  achievedAt,
  meta = {},
  compact = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const gradient = getMilestoneGradient(type);
  const iconEmoji = getMilestoneIcon(icon || '');

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    const success = await shareImage(
      cardRef.current,
      title,
      `I achieved "${title}" on NOIL! 🎉`
    );
    
    if (success) {
      toast({
        title: "Ready to share!",
        description: "Your milestone card has been prepared.",
      });
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    await downloadImage(cardRef.current, `noil-milestone-${type}.png`);
    toast({
      title: "Downloaded!",
      description: "Your milestone card has been saved.",
    });
  };

  if (compact) {
    return (
      <Card className="p-3 flex items-center gap-3 bg-gradient-to-r from-background to-muted/50">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xl`}>
          {iconEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="text-4xl mb-3">{iconEmoji}</div>
            <div className="text-xs opacity-75 bg-white/20 px-2 py-1 rounded-full">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-1">{title}</h3>
          <p className="text-sm opacity-90 mb-3">{description}</p>
          
          {meta.streakDays && (
            <div className="text-2xl font-bold">{meta.streakDays} Days 🔥</div>
          )}
          {meta.reductionPercent && (
            <div className="text-2xl font-bold">-{meta.reductionPercent}% 📉</div>
          )}
          {meta.rankPercent && (
            <div className="text-2xl font-bold">Top {meta.rankPercent}% 🏆</div>
          )}
          {meta.householdGrade && (
            <div className="text-2xl font-bold">Grade {meta.householdGrade} 🏠</div>
          )}
          
          {achievedAt && (
            <p className="text-xs opacity-75 mt-4">
              Achieved on {format(new Date(achievedAt), 'MMM d, yyyy')}
            </p>
          )}
          
          <p className="text-xs opacity-60 mt-2">Created with NOIL</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
