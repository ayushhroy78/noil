import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BlockchainBadge } from "@/components/BlockchainBadge";
import {
  ArrowLeft,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Droplet,
  Award,
  TrendingUp,
  Users,
  RefreshCw,
  Plus,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface RestaurantApplication {
  id: string;
  restaurant_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  description: string | null;
  logo_url: string | null;
  food_photos: string[];
  menu_items: any[];
  oil_types: string[];
  cooking_methods: string[];
  cuisines: string[];
  certifications: string[];
  daily_customers: string | null;
  years_in_business: string | null;
  status: string;
  admin_notes: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  blockchain_certified?: boolean;
  blockchain_hash?: string | null;
  blockchain_tx_hash?: string | null;
  blockchain_network?: string | null;
  blockchain_certified_at?: string | null;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Under Review",
  },
  approved: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Rejected",
  },
};

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<RestaurantApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("restaurant_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse food_photos from JSONB
      const parsedData = (data || []).map((app: any) => ({
        ...app,
        food_photos: Array.isArray(app.food_photos) ? app.food_photos : [],
        menu_items: Array.isArray(app.menu_items) ? app.menu_items : [],
      }));

      setApplications(parsedData);
      if (parsedData.length > 0) {
        setSelectedApp(parsedData[0]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load your applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Partner Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage your restaurant applications</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto">
        {applications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Applications Yet</h2>
              <p className="text-muted-foreground mb-6">
                Register your restaurant to become a Noil partner
              </p>
              <Button onClick={() => navigate("/restaurant-apply")}>
                <Plus className="w-4 h-4 mr-2" />
                Register Restaurant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Application Selector (if multiple) */}
            {applications.length > 1 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {applications.map((app) => (
                      <Button
                        key={app.id}
                        variant={selectedApp?.id === app.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        {app.restaurant_name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedApp && (
              <>
                {/* Status Card */}
                <Card className={`border-2 ${
                  selectedApp.status === 'approved' ? 'border-green-200 dark:border-green-800' :
                  selectedApp.status === 'rejected' ? 'border-red-200 dark:border-red-800' :
                  'border-amber-200 dark:border-amber-800'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {selectedApp.logo_url ? (
                        <img
                          src={selectedApp.logo_url}
                          alt={selectedApp.restaurant_name}
                          className="w-20 h-20 rounded-xl object-cover border"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                          <Store className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-xl font-bold">{selectedApp.restaurant_name}</h2>
                            <p className="text-sm text-muted-foreground">{selectedApp.owner_name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(selectedApp.status)}
                            <BlockchainBadge
                              certified={selectedApp.blockchain_certified || false}
                              txHash={selectedApp.blockchain_tx_hash}
                              network={selectedApp.blockchain_network}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedApp.city}, {selectedApp.state}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied on {format(new Date(selectedApp.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className={`mt-4 p-4 rounded-lg ${
                      selectedApp.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20' :
                      selectedApp.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                      {selectedApp.status === 'pending' && (
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Application Under Review</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              Our team is reviewing your application. This usually takes 3-5 business days.
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedApp.status === 'approved' && (
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-green-800 dark:text-green-200">Congratulations! You're Approved</p>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              Your restaurant is now live on the Noil platform. Customers can discover you in our healthy dining listings.
                            </p>
                            {selectedApp.approved_at && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                Approved on {format(new Date(selectedApp.approved_at), "MMM d, yyyy")}
                              </p>
                            )}
                            {selectedApp.blockchain_certified && (
                              <div className="mt-3">
                                <BlockchainBadge
                                  certified={true}
                                  txHash={selectedApp.blockchain_tx_hash}
                                  network={selectedApp.blockchain_network}
                                  hash={selectedApp.blockchain_hash}
                                  certifiedAt={selectedApp.blockchain_certified_at}
                                  showDetails={true}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedApp.status === 'rejected' && (
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800 dark:text-red-200">Application Not Approved</p>
                            {selectedApp.admin_notes ? (
                              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                {selectedApp.admin_notes}
                              </p>
                            ) : (
                              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                Unfortunately, your application didn't meet our criteria. You can apply again with updated information.
                              </p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => navigate("/restaurant-apply")}
                            >
                              Apply Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Details Tabs */}
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="menu">Menu</TabsTrigger>
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {selectedApp.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {selectedApp.phone}
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>{selectedApp.address}, {selectedApp.city}, {selectedApp.state}</span>
                        </div>
                        {selectedApp.description && (
                          <p className="text-sm text-muted-foreground pt-2 border-t">
                            {selectedApp.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Droplet className="w-4 h-4" />
                            Oil Types
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {selectedApp.oil_types.map((oil) => (
                              <Badge key={oil} variant="secondary" className="text-xs">
                                {oil}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ChefHat className="w-4 h-4" />
                            Cooking Methods
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {selectedApp.cooking_methods.map((method) => (
                              <Badge key={method} variant="secondary" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {(selectedApp.cuisines.length > 0 || selectedApp.certifications.length > 0) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApp.cuisines.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Store className="w-4 h-4" />
                                Cuisines
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-1">
                                {selectedApp.cuisines.map((cuisine) => (
                                  <Badge key={cuisine} variant="outline" className="text-xs">
                                    {cuisine}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {selectedApp.certifications.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Certifications
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-1">
                                {selectedApp.certifications.map((cert) => (
                                  <Badge key={cert} variant="outline" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {(selectedApp.daily_customers || selectedApp.years_in_business) && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Business Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {selectedApp.daily_customers && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{selectedApp.daily_customers} daily customers</span>
                              </div>
                            )}
                            {selectedApp.years_in_business && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{selectedApp.years_in_business} in business</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="menu" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ChefHat className="w-4 h-4" />
                          Menu Items ({selectedApp.menu_items.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedApp.menu_items.length > 0 ? (
                          <div className="space-y-3">
                            {selectedApp.menu_items.map((item: any, index: number) => (
                              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.oilUsed} • {item.cookingMethod}
                                    </p>
                                    {item.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No menu items added
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="photos" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Food Photos ({selectedApp.food_photos.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedApp.food_photos.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {selectedApp.food_photos.map((photo, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                                <img
                                  src={photo}
                                  alt={`Food photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No food photos uploaded
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                {selectedApp.status === 'approved' && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-8 h-8 text-primary" />
                          <div>
                            <p className="font-medium">Your listing is live!</p>
                            <p className="text-sm text-muted-foreground">
                              Customers can now find you on Noil
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/restaurants")}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Listing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* New Application Button */}
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/restaurant-apply")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit New Application
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default RestaurantDashboard;