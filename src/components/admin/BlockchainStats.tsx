import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Link2, 
  Clock,
  TrendingUp
} from "lucide-react";

interface RestaurantApplication {
  id: string;
  restaurant_name: string;
  status: string;
  blockchain_certified?: boolean;
  blockchain_hash?: string | null;
  blockchain_tx_hash?: string | null;
  blockchain_network?: string | null;
  blockchain_certified_at?: string | null;
  approved_at?: string | null;
}

interface BlockchainStatsProps {
  applications: RestaurantApplication[];
}

export const BlockchainStats = ({ applications }: BlockchainStatsProps) => {
  const approvedApps = applications.filter(a => a.status === "approved");
  const certifiedApps = approvedApps.filter(a => a.blockchain_certified);
  const uncertifiedApps = approvedApps.filter(a => !a.blockchain_certified);
  
  const certificationRate = approvedApps.length > 0 
    ? Math.round((certifiedApps.length / approvedApps.length) * 100) 
    : 0;

  // Get recent certifications (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCertifications = certifiedApps.filter(a => 
    a.blockchain_certified_at && new Date(a.blockchain_certified_at) >= sevenDaysAgo
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-primary" />
          Blockchain Certification Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{certifiedApps.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Certified</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{uncertifiedApps.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Uncertified</p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{certificationRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{recentCertifications.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Last 7 Days</p>
          </div>
        </div>

        {/* Failed Certifications List */}
        {uncertifiedApps.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              Approved But Not Certified ({uncertifiedApps.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uncertifiedApps.map(app => (
                <div 
                  key={app.id} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium">{app.restaurant_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Approved: {app.approved_at ? new Date(app.approved_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending Cert
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Certifications */}
        {recentCertifications.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Link2 className="w-4 h-4" />
              Recent Certifications
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentCertifications.slice(0, 5).map(app => (
                <div 
                  key={app.id} 
                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium">{app.restaurant_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {app.blockchain_tx_hash?.slice(0, 16)}...
                    </p>
                  </div>
                  <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
