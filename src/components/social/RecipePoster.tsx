import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download, Heart, Leaf, Droplet, Clock } from 'lucide-react';
import { shareImage, downloadImage } from '@/lib/imageExport';
import { useToast } from '@/hooks/use-toast';

interface RecipePosterProps {
  title: string;
  description?: string;
  oilUsageMl: number;
  prepTimeMinutes?: number;
  healthTags?: string[];
  ingredients?: string[];
  showShareButtons?: boolean;
}

export const RecipePoster: React.FC<RecipePosterProps> = ({
  title,
  description,
  oilUsageMl,
  prepTimeMinutes,
  healthTags = [],
  ingredients = [],
  showShareButtons = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!cardRef.current) return;
    const success = await shareImage(
      cardRef.current,
      title,
      `Check out this healthy recipe: ${title} - Only ${oilUsageMl}ml of oil! 🥗`
    );
    if (success) {
      toast({ title: "Ready to share!" });
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    await downloadImage(cardRef.current, `noil-recipe-${title.toLowerCase().replace(/\s+/g, '-')}.png`);
    toast({ title: "Downloaded!" });
  };

  const getOilBadgeColor = () => {
    if (oilUsageMl <= 5) return 'from-green-400 to-emerald-500';
    if (oilUsageMl <= 15) return 'from-yellow-400 to-orange-500';
    return 'from-orange-400 to-red-500';
  };

  const getOilLabel = () => {
    if (oilUsageMl === 0) return 'Zero Oil';
    if (oilUsageMl <= 5) return 'Very Low Oil';
    if (oilUsageMl <= 15) return 'Low Oil';
    return 'Moderate Oil';
  };

  return (
    <div className="space-y-2">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 shadow-lg"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-200/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          {/* Oil badge */}
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${getOilBadgeColor()} text-white text-sm font-medium mb-4`}>
            <Droplet className="w-4 h-4" />
            {oilUsageMl}ml • {getOilLabel()}
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          
          {description && (
            <p className="text-gray-600 text-sm mb-4">{description}</p>
          )}
          
          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-4">
            {prepTimeMinutes && (
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <Clock className="w-4 h-4" />
                {prepTimeMinutes} min
              </div>
            )}
            {healthTags.slice(0, 3).map((tag, idx) => (
              <div key={idx} className="flex items-center gap-1 text-gray-600 text-sm bg-white/70 px-2 py-1 rounded-full">
                {tag === 'Heart Healthy' ? <Heart className="w-4 h-4 text-red-400" /> :
                 tag === 'High Fiber' ? <Leaf className="w-4 h-4 text-green-500" /> :
                 <Leaf className="w-4 h-4 text-green-500" />}
                {tag}
              </div>
            ))}
          </div>
          
          {/* Key ingredients preview */}
          {ingredients.length > 0 && (
            <div className="bg-white/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Key Ingredients</p>
              <p className="text-sm text-gray-700">
                {ingredients.slice(0, 5).join(' • ')}
                {ingredients.length > 5 && ` +${ingredients.length - 5} more`}
              </p>
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
            <p className="text-xs text-gray-400">Created with NOIL</p>
            <div className="flex items-center gap-1 text-xs text-primary font-medium">
              <Leaf className="w-3 h-3" />
              Healthy Oil Habits
            </div>
          </div>
        </div>
      </div>
      
      {showShareButtons && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Share Recipe
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
