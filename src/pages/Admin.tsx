import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Store,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Droplet,
  Utensils,
  Eye,
} from "lucide-react";

interface RestaurantApplication {
  id: string;
  user_id: string;
  restaurant_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  description: string | null;
  menu_items: any[];
  oil_types: string[];
  cooking_methods: string[];
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<RestaurantApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      // Check admin role using the secure user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchApplications();
    };

    checkAdmin();
  }, [navigate, toast]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("restaurant_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: RestaurantApplication) => {
    setProcessing(true);
    try {
      const { error: updateError } = await (supabase as any)
        .from("restaurant_applications")
        .update({
          status: "approved",
          admin_notes: adminNotes || null,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      const { error: insertError } = await (supabase as any).from("restaurants").insert({
        application_id: application.id,
        name: application.restaurant_name,
        description: application.description,
        address: application.address,
        city: application.city,
        state: application.state,
        phone: application.phone,
        email: application.email,
        menu_items: application.menu_items,
        oil_types: application.oil_types,
        cooking_methods: application.cooking_methods,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast({
        title: "Application Approved",
        description: `${application.restaurant_name} has been approved and listed.`,
      });

      setSelectedApplication(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error) {
      console.error("Error approving application:", error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (application: RestaurantApplication) => {
    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("restaurant_applications")
        .update({
          status: "rejected",
          admin_notes: adminNotes || null,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (error) throw error;

      toast({
        title: "Application Rejected",
        description: `${application.restaurant_name} has been rejected.`,
      });

      setSelectedApplication(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingApps = applications.filter((a) => a.status === "pending");
  const approvedApps = applications.filter((a) => a.status === "approved");
  const rejectedApps = applications.filter((a) => a.status === "rejected");

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Manage restaurant applications</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingApps.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-600">{approvedApps.length}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-red-600">{rejectedApps.length}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingApps.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedApps.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedApps.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="pending">
                <ApplicationList
                  applications={pendingApps}
                  onView={setSelectedApplication}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
              <TabsContent value="approved">
                <ApplicationList
                  applications={approvedApps}
                  onView={setSelectedApplication}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
              <TabsContent value="rejected">
                <ApplicationList
                  applications={rejectedApps}
                  onView={setSelectedApplication}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              {selectedApplication?.restaurant_name}
            </DialogTitle>
            <DialogDescription>
              Application submitted on {selectedApplication && new Date(selectedApplication.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedApplication.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium">{selectedApplication.owner_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-medium">{selectedApplication.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </p>
                  <p className="font-medium">{selectedApplication.city}, {selectedApplication.state}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p>{selectedApplication.address}</p>
              </div>

              {selectedApplication.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedApplication.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Droplet className="w-3 h-3" /> Oil Types
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedApplication.oil_types.map((oil) => (
                    <Badge key={oil} variant="secondary" className="text-xs">
                      {oil}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <ChefHat className="w-3 h-3" /> Cooking Methods
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedApplication.cooking_methods.map((method) => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Utensils className="w-3 h-3" /> Menu Items ({selectedApplication.menu_items.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedApplication.menu_items.map((item, index) => (
                    <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.oilUsed} | {item.cookingMethod}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedApplication.status === "pending" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Admin Notes (Optional)</p>
                    <Textarea
                      placeholder="Add notes about this application..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      data-testid="input-admin-notes"
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedApplication)}
                      disabled={processing}
                      data-testid="button-reject"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedApplication)}
                      disabled={processing}
                      data-testid="button-approve"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}

              {selectedApplication.admin_notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm">{selectedApplication.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

interface ApplicationListProps {
  applications: RestaurantApplication[];
  onView: (app: RestaurantApplication) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const ApplicationList = ({ applications, onView, getStatusBadge }: ApplicationListProps) => {
  if (applications.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No applications in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <Card key={app.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{app.restaurant_name}</h3>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {app.owner_name} | {app.city}, {app.state}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Droplet className="w-3 h-3" />
                    {app.oil_types.length} oils
                  </span>
                  <span className="flex items-center gap-1">
                    <ChefHat className="w-3 h-3" />
                    {app.cooking_methods.length} methods
                  </span>
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    {app.menu_items.length} items
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(app)}
                data-testid={`button-view-${app.id}`}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Admin;
