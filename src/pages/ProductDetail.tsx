import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Wifi, Battery, Droplets, Smartphone, Shield, Zap, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import iotOilDispenser from "@/assets/iot-oil-dispenser.png";

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | undefined>();
  const { products, loading } = useProducts();
  const cart = useCart(userId);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

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

  const product = products.find(p => p.id === productId);
  const selectedVariant = product?.variants?.[selectedVariantIndex];

  const specifications = [
    { icon: Wifi, label: "Connectivity", value: "Bluetooth 5.0 & WiFi" },
    { icon: Battery, label: "Battery Life", value: "6 months (rechargeable)" },
    { icon: Droplets, label: "Capacity", value: "Up to 1000ml bottles" },
    { icon: Smartphone, label: "App Support", value: "iOS & Android" },
    { icon: Shield, label: "Warranty", value: "1 Year Manufacturer" },
    { icon: Zap, label: "Accuracy", value: "±1ml precision" },
  ];

  const features = [
    "Automatic oil usage tracking with real-time sync",
    "Smart alerts when oil levels are running low",
    "Integration with daily consumption logs",
    "Food-grade stainless steel construction",
    "Easy-pour spout with anti-drip design",
    "LED indicator for battery and sync status",
    "Washable and dishwasher safe components",
    "Compatible with all cooking oil types",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
          <Skeleton className="h-10 w-40" />
        </header>
        <main className="px-4 py-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Product not found</p>
          <Button onClick={() => navigate("/oilhub")}>Back to Store</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (selectedVariant) {
      cart.addToCart(product.id, selectedVariant.id);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/oilhub")}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Product Details</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Product Image */}
        <div className="relative w-full aspect-square max-h-80 bg-gradient-to-br from-secondary/50 to-secondary rounded-2xl overflow-hidden">
          <img
            src={product.image_url || iotOilDispenser}
            alt={product.name}
            className="w-full h-full object-contain p-4"
          />
          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
            IoT Enabled
          </Badge>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
            <p className="text-muted-foreground mt-1">{product.description}</p>
          </div>

          {/* Health Tags */}
          <div className="flex flex-wrap gap-2">
            {product.health_tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Select Variant</h3>
              <div className="flex gap-2 flex-wrap">
                {product.variants.map((variant, index) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantIndex(index)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedVariantIndex === index
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {variant.variant_name}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-3xl font-bold text-foreground">
                    ₹{selectedVariant?.price}
                  </span>
                  {selectedVariant && selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      In Stock ({selectedVariant.stock_quantity} available)
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Tabs for Details */}
        <Tabs defaultValue="specs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="howto">How It Works</TabsTrigger>
          </TabsList>

          <TabsContent value="specs" className="mt-4">
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <spec.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{spec.label}</p>
                      <p className="text-sm font-medium text-foreground">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <Card className="p-4">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="howto" className="mt-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Pair the Device</h4>
                    <p className="text-sm text-muted-foreground">
                      Download the Noil app and pair your Smart Oil Dispenser via Bluetooth. The LED will turn blue when connected.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Fill with Oil</h4>
                    <p className="text-sm text-muted-foreground">
                      Pour your cooking oil into the dispenser. The device will automatically detect the initial volume.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Cook as Usual</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the dispenser for cooking. Each pour is measured and automatically synced to your daily tracking logs.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Track Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      View your consumption trends, get health insights, and receive smart recommendations to reduce oil usage.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add to Cart Button - Fixed at bottom */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="text-2xl font-bold text-foreground">₹{selectedVariant?.price || 0}</p>
            </div>
            <Button
              size="lg"
              onClick={handleAddToCart}
              className="gap-2 px-8"
              disabled={!selectedVariant}
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProductDetail;
