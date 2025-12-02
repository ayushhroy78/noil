import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface CartSheetProps {
  userId: string | undefined;
}

export const CartSheet = ({ userId }: CartSheetProps) => {
  const { cartItems, loading, updateQuantity, removeFromCart, getCartTotal, getCartCount } =
    useCart(userId);
  const navigate = useNavigate();

  const deliveryCharges = 40;
  const finalTotal = getCartTotal() + deliveryCharges;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ShoppingCart className="w-5 h-5 text-primary" />
          {getCartCount() > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
              {getCartCount()}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Your Cart ({getCartCount()} items)</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          <div className="flex-1 overflow-auto space-y-4">
            {loading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-card rounded-lg border">
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-foreground">{item.product_name}</h4>
                    <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                    <p className="text-sm font-semibold text-foreground">₹{item.price}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{getCartTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-semibold">₹{deliveryCharges}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">₹{finalTotal}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  // Navigate to checkout or show checkout modal
                  alert("Checkout feature coming soon! Your order will be processed.");
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};