import { ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/oilhub/ProductCard";
import { CartSheet } from "@/components/oilhub/CartSheet";
import { RegionSelector } from "@/components/oilhub/RegionSelector";
import { Skeleton } from "@/components/ui/skeleton";

const OilHub = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const { products, loading, getRecommendedProducts, getOilProducts, getIoTProducts } = useProducts();
  const { addToCart } = useCart(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };
    getUser();
  }, [navigate]);

  const recommendedProducts = getRecommendedProducts(selectedRegion);
  const allOils = getOilProducts();
  const iotProducts = getIoTProducts();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <h1 className="text-xl font-bold text-foreground">OilHub</h1>
          </div>
          <CartSheet userId={userId} />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-1">Healthy Oils & IoT Devices</h2>
          <p className="text-muted-foreground">Certified quality oils for your wellness journey</p>
        </div>

        <RegionSelector userId={userId} onRegionChange={setSelectedRegion} />

        <Tabs defaultValue="recommended" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="all">All Oils</TabsTrigger>
            <TabsTrigger value="iot">IoT Devices</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Recommended for You
              </h3>
              {loading ? (
                <div className="grid gap-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : recommendedProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Select your region to see personalized recommendations</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {recommendedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">All Healthy Oils</h3>
              {loading ? (
                <div className="grid gap-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {allOils.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="iot" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Smart Oil Tracking Devices</h3>
              <p className="text-sm text-muted-foreground">
                Automatically track your oil usage with our IoT devices
              </p>
              {loading ? (
                <div className="grid gap-4">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {iotProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default OilHub;
