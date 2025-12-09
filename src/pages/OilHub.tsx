import { ArrowLeft, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/oilhub/ProductCard";
import { CartSheet } from "@/components/oilhub/CartSheet";
import { Skeleton } from "@/components/ui/skeleton";

const OilHub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | undefined>();
  const { loading, getIoTProducts } = useProducts();
  const cart = useCart(userId);

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
            <h1 className="text-xl font-bold text-foreground">{t('oilhub.title')}</h1>
          </div>
          <CartSheet userId={userId} cart={cart} />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">{t('oilhub.smartTracking')}</h2>
          <p className="text-muted-foreground">{t('oilhub.subtitle')}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            {t('oilhub.iotDevices')}
          </h3>
          {loading ? (
            <div className="grid gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : iotProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('oilhub.noDevices')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {iotProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={cart.addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default OilHub;
