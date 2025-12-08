import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Star,
  Filter,
} from "lucide-react";

interface Restaurant {
  id: string;
  application_id?: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  menu_items: any[];
  oil_types: string[];
  cooking_methods: string[];
  is_featured: boolean;
  blockchain_certified?: boolean;
  blockchain_tx_hash?: string | null;
  blockchain_network?: string | null;
  blockchain_hash?: string | null;
  blockchain_certified_at?: string | null;
}

const Restaurants = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, selectedCity, restaurants]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      // Fetch restaurants with their application data for blockchain info
      const { data: restaurantsData, error } = await (supabase as any)
        .from("restaurants")
        .select("*, restaurant_applications!application_id(blockchain_certified, blockchain_tx_hash, blockchain_network, blockchain_hash, blockchain_certified_at)")
        .eq("is_active", true)
        .order("is_featured", { ascending: false });

      if (error) throw error;
      
      // Flatten the data to include blockchain fields
      const processedData = (restaurantsData || []).map((r: any) => ({
        ...r,
        blockchain_certified: r.restaurant_applications?.blockchain_certified || false,
        blockchain_tx_hash: r.restaurant_applications?.blockchain_tx_hash,
        blockchain_network: r.restaurant_applications?.blockchain_network,
        blockchain_hash: r.restaurant_applications?.blockchain_hash,
        blockchain_certified_at: r.restaurant_applications?.blockchain_certified_at,
      }));
      
      setRestaurants(processedData);
      setFilteredRestaurants(processedData);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      // Fallback: fetch without blockchain data
      try {
        const { data } = await (supabase as any)
          .from("restaurants")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false });
        setRestaurants(data || []);
        setFilteredRestaurants(data || []);
      } catch (e) {
        console.error("Fallback fetch also failed:", e);
      }
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
          r.name.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query) ||
          r.oil_types.some((o: string) => o.toLowerCase().includes(query))
      );
    }

    if (selectedCity) {
      filtered = filtered.filter((r) => r.city === selectedCity);
    }

    setFilteredRestaurants(filtered);
  };

  const cities = [...new Set(restaurants.map((r) => r.city))].sort();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/discover")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Healthy Restaurants
            </h1>
            <p className="text-xs text-muted-foreground">
              Restaurants using healthy cooking oils
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or oil type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCity === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCity(null)}
                data-testid="button-all-cities"
              >
                All Cities
              </Button>
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCity(city)}
                  data-testid={`button-city-${city.toLowerCase()}`}
                >
                  {city}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="pt-8 pb-8 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-2">No Restaurants Found</p>
              <p className="text-sm text-muted-foreground">
                {restaurants.length === 0
                  ? "No healthy restaurants have been listed yet. Check back soon!"
                  : "Try adjusting your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedRestaurant(restaurant)}
                data-testid={`card-restaurant-${restaurant.id}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium truncate">{restaurant.name}</h3>
                        {restaurant.blockchain_certified && (
                          <BlockchainBadge
                            certified={true}
                            txHash={restaurant.blockchain_tx_hash}
                            network={restaurant.blockchain_network}
                          />
                        )}
                        {restaurant.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 shrink-0">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {restaurant.city}, {restaurant.state}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.oil_types.slice(0, 3).map((oil: string) => (
                          <Badge key={oil} variant="secondary" className="text-xs">
                            {oil}
                          </Badge>
                        ))}
                        {restaurant.oil_types.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{restaurant.oil_types.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              {selectedRestaurant?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {selectedRestaurant?.city}, {selectedRestaurant?.state}
            </DialogDescription>
          </DialogHeader>

          {selectedRestaurant && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedRestaurant.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Star className="w-3 h-3 mr-1" />
                    Featured Restaurant
                  </Badge>
                )}
                <BlockchainBadge
                  certified={selectedRestaurant.blockchain_certified || false}
                  txHash={selectedRestaurant.blockchain_tx_hash}
                  network={selectedRestaurant.blockchain_network}
                  hash={selectedRestaurant.blockchain_hash}
                  certifiedAt={selectedRestaurant.blockchain_certified_at}
                />
              </div>

              {/* Detailed blockchain info for certified restaurants */}
              {selectedRestaurant.blockchain_certified && (
                <BlockchainBadge
                  certified={true}
                  txHash={selectedRestaurant.blockchain_tx_hash}
                  network={selectedRestaurant.blockchain_network}
                  hash={selectedRestaurant.blockchain_hash}
                  certifiedAt={selectedRestaurant.blockchain_certified_at}
                  showDetails={true}
                />
              )}

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
                  <Droplet className="w-3 h-3" /> Healthy Oils Used
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedRestaurant.oil_types.map((oil: string) => (
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
                  {selectedRestaurant.cooking_methods.map((method: string) => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedRestaurant.menu_items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <Utensils className="w-3 h-3" /> Popular Dishes
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRestaurant.menu_items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="p-2 bg-muted/50 rounded text-sm"
                      >
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.oilUsed} | {item.cookingMethod}
                        </p>
                      </div>
                    ))}
                  </div>
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

export default Restaurants;
