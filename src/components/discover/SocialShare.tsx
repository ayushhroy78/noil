import { Share2, Twitter, Facebook, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  type: "achievement" | "health_score";
  title: string;
  description: string;
  score?: number;
  trigger?: React.ReactNode;
}

export const SocialShare = ({ type, title, description, score, trigger }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareText = type === "health_score"
    ? `🎯 My Health Score on Noil is ${score}/100! ${description} Track your oil consumption and improve your health with Noil! #Noil #HealthyLiving #WellnessJourney`
    : `🏆 Achievement Unlocked on Noil! ${title} - ${description} Join me on my healthy cooking journey! #Noil #Achievement #HealthyLifestyle`;

  const shareUrl = window.location.origin;

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText + "\n\n" + shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your {type === "health_score" ? "Health Score" : "Achievement"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">{shareText}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border-[#1DA1F2]/30"
              onClick={handleTwitterShare}
            >
              <Twitter className="h-4 w-4 text-[#1DA1F2]" />
              Twitter
            </Button>
            
            <Button
              variant="outline"
              className="gap-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border-[#1877F2]/30"
              onClick={handleFacebookShare}
            >
              <Facebook className="h-4 w-4 text-[#1877F2]" />
              Facebook
            </Button>
            
            <Button
              variant="outline"
              className="gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </Button>
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
