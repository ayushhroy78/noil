import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BlockchainBadge } from "@/components/BlockchainBadge";
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Droplet,
  Utensils,
  Search,
  Shield,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface CertifiedRestaurant {
  id: string;
  restaurant_name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  menu_items: any[];
  oil_types: string[];
  cooking_methods: string[];
  blockchain_certified: boolean;
  blockchain_tx_hash: string | null;
  blockchain_network: string | null;
  blockchain_hash: string | null;
  blockchain_certified_at: string | null;
  approved_at: string | null;
}

const CertifiedRestaurants = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<CertifiedRestaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<CertifiedRestaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<CertifiedRestaurant | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    fetchCertifiedRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, selectedState, restaurants]);

  const fetchCertifiedRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("restaurant_applications")
        .select("*")
        .eq("status", "approved")
        .eq("blockchain_certified", true)
        .order("blockchain_certified_at", { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
      setFilteredRestaurants(data || []);
    } catch (error) {
      console.error("Error fetching certified restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.restaurant_name.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query) ||
          r.state.toLowerCase().includes(query) ||
          r.oil_types?.some((o: string) => o.toLowerCase().includes(query))
      );
    }

    if (selectedState) {
      filtered = filtered.filter((r) => r.state === selectedState);
    }

    setFilteredRestaurants(filtered);
  };

  const states = [...new Set(restaurants.map((r) => r.state))].sort();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <header className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Blockchain Verified</h1>
              <p className="text-sm opacity-90">Trusted Restaurant Partners</p>
            </div>
          </div>
          <p className="text-sm opacity-80 mt-4">
            These restaurants have been verified on the blockchain for their commitment to healthy cooking practices. Each certification is immutably recorded for transparency and trust.
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>{restaurants.length} Certified</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{states.length} States</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or oil type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {states.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedState === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedState(null)}
              >
                All States
              </Button>
              {states.slice(0, 5).map((state) => (
                <Button
                  key={state}
                  variant={selectedState === state ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedState(state)}
                >
                  {state}
                </Button>
              ))}
              {states.length > 5 && (
                <Badge variant="outline" className="px-3 py-1">
                  +{states.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="pt-8 pb-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-2">No Certified Restaurants Found</p>
              <p className="text-sm text-muted-foreground">
                {restaurants.length === 0
                  ? "No restaurants have been blockchain certified yet."
                  : "Try adjusting your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-green-500 overflow-hidden"
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 text-white">
                      <Shield className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg">{restaurant.restaurant_name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {restaurant.city}, {restaurant.state}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {restaurant.oil_types?.slice(0, 3).map((oil: string) => (
                          <Badge key={oil} variant="secondary" className="text-xs">
                            <Droplet className="w-2 h-2 mr-1" />
                            {oil}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <BlockchainBadge
                          certified={true}
                          txHash={restaurant.blockchain_tx_hash}
                          network={restaurant.blockchain_network}
                        />
                        <p className="text-xs text-muted-foreground">
                          Certified {restaurant.blockchain_certified_at 
                            ? new Date(restaurant.blockchain_certified_at).toLocaleDateString() 
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* How It Works Section */}
        <Card className="mt-8 bg-gradient-to-br from-muted/50 to-muted">
          <CardContent className="pt-6 pb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              How Blockchain Certification Works
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">1</div>
                <p>Restaurant applies with their healthy cooking practices and oil usage details.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">2</div>
                <p>Our team reviews and verifies the application for health compliance.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">3</div>
                <p>Upon approval, a cryptographic hash is generated and stored on the blockchain.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">4</div>
                <p>The certification is immutable and publicly verifiable, ensuring trust and transparency.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Restaurant Detail Dialog */}
      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              {selectedRestaurant?.restaurant_name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {selectedRestaurant?.city}, {selectedRestaurant?.state}
            </DialogDescription>
          </DialogHeader>

          {selectedRestaurant && (
            <div className="space-y-4">
              {/* Blockchain Verification Details */}
              <BlockchainBadge
                certified={true}
                txHash={selectedRestaurant.blockchain_tx_hash}
                network={selectedRestaurant.blockchain_network}
                hash={selectedRestaurant.blockchain_hash}
                certifiedAt={selectedRestaurant.blockchain_certified_at}
                showDetails={true}
              />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="text-sm">
                  {selectedRestaurant.address}, {selectedRestaurant.city},{" "}
                  {selectedRestaurant.state}
                </p>
              </div>

              {selectedRestaurant.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${selectedRestaurant.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedRestaurant.phone}
                  </a>
                </div>
              )}

              {selectedRestaurant.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${selectedRestaurant.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedRestaurant.email}
                  </a>
                </div>
              )}

              {selectedRestaurant.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">About</p>
                  <p className="text-sm">{selectedRestaurant.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Droplet className="w-3 h-3" /> Certified Healthy Oils
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedRestaurant.oil_types?.map((oil: string) => (
                    <Badge key={oil} className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
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
                  {selectedRestaurant.cooking_methods?.map((method: string) => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedRestaurant.menu_items?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <Utensils className="w-3 h-3" /> Healthy Menu Items
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRestaurant.menu_items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="p-2 bg-muted/50 rounded text-sm"
                      >
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.oilUsed} | {item.cookingMethod}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Certified on {selectedRestaurant.blockchain_certified_at 
                    ? new Date(selectedRestaurant.blockchain_certified_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'blockchain'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default CertifiedRestaurants;
