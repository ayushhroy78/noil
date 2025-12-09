import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Copy, Check, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChallengeTokenDisplayProps {
  challengeId: string;
  userChallengeId: string;
  onProceed: (token: string) => void;
  onCancel: () => void;
}

interface TokenData {
  token: string;
  display_time: string;
  expires_at: string;
}

export const ChallengeTokenDisplay = ({
  challengeId,
  userChallengeId,
  onProceed,
  onCancel,
}: ChallengeTokenDisplayProps) => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    generateToken();
  }, [challengeId, userChallengeId]);

  useEffect(() => {
    if (!tokenData?.expires_at) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(tokenData.expires_at).getTime() - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenData?.expires_at]);

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-challenge-token", {
        body: {
          challenge_id: challengeId,
          user_challenge_id: userChallengeId,
        },
      });

      if (error) throw error;

      if (data.success) {
        setTokenData({
          token: data.token,
          display_time: data.display_time,
          expires_at: data.expires_at,
        });
      } else {
        throw new Error(data.error || "Failed to generate token");
      }
    } catch (error: any) {
      console.error("Error generating token:", error);
      toast.error("Failed to generate verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (tokenData) {
      navigator.clipboard.writeText(`${tokenData.token} - ${tokenData.display_time}`);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpired = timeRemaining <= 0 && tokenData !== null;

  return (
    <Card className="shadow-soft border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-primary">
          <Shield className="w-5 h-5" />
          <h3 className="font-semibold">Photo Verification Required</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tokenData ? (
          <>
            {/* Instructions */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                To verify your meal photo is authentic, please write this code and timestamp on paper:
              </p>

              {/* Token Display */}
              <div className="p-4 bg-card rounded-lg border-2 border-primary/50 text-center space-y-2">
                <p className="text-3xl font-bold tracking-wider text-primary font-mono">
                  {tokenData.token}
                </p>
                <p className="text-lg font-medium text-foreground">
                  {tokenData.display_time}
                </p>
              </div>

              {/* Time Remaining */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className={isExpired ? "text-destructive" : "text-muted-foreground"}>
                    {isExpired 
                      ? "Code expired" 
                      : `Expires in ${formatTimeRemaining(timeRemaining)}`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {isExpired && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>Your code has expired.</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateToken}
                    className="ml-auto gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Get New Code
                  </Button>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Steps to follow:</p>
                <ol className="text-sm text-muted-foreground space-y-1.5 ml-4 list-decimal">
                  <li>Write <span className="font-medium text-foreground">{tokenData.token}</span> on a piece of paper</li>
                  <li>Write the time: <span className="font-medium text-foreground">{tokenData.display_time}</span></li>
                  <li>Place the paper next to your meal</li>
                  <li>Take a clear photo showing both the food and the paper</li>
                </ol>
              </div>

              {/* Bonus Badge */}
              <div className="flex items-center gap-2">
                <Badge className="bg-success/20 text-success">+30 bonus points</Badge>
                <span className="text-xs text-muted-foreground">for verified photos</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => onProceed(tokenData.token)} 
                className="flex-1"
                disabled={isExpired}
              >
                I've Done This, Proceed
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Failed to generate verification code.
            </p>
            <Button onClick={generateToken} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
