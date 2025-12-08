import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink, CheckCircle, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BlockchainBadgeProps {
  certified: boolean;
  txHash?: string | null;
  network?: string | null;
  hash?: string | null;
  certifiedAt?: string | null;
  showDetails?: boolean;
}

export const BlockchainBadge = ({
  certified,
  txHash,
  network,
  hash,
  certifiedAt,
  showDetails = false,
}: BlockchainBadgeProps) => {
  if (!certified) {
    return showDetails ? (
      <Badge variant="outline" className="text-muted-foreground">
        <Clock className="w-3 h-3 mr-1" />
        Not Verified
      </Badge>
    ) : null;
  }

  const shortTxHash = txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : '';
  const shortHash = hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : '';

  if (showDetails) {
    return (
      <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-700 dark:text-green-400">Blockchain Verified</span>
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <p><span className="font-medium">Network:</span> {network}</p>
          <p><span className="font-medium">Hash:</span> {shortHash}</p>
          <p><span className="font-medium">Transaction:</span> {shortTxHash}</p>
          {certifiedAt && (
            <p><span className="font-medium">Certified:</span> {new Date(certifiedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-help">
            <Shield className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Blockchain Certified
            </p>
            <p className="text-xs text-muted-foreground">
              This restaurant's certification is recorded on {network}
            </p>
            {txHash && (
              <p className="text-xs font-mono">{shortTxHash}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
