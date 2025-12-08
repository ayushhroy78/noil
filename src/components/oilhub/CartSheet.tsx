import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CheckCircle2, Package, Phone } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppCheckout } from "./WhatsAppCheckout";
import { Button } from "@/components/ui/button";

interface CartSheetProps {
  userId: string | undefined;
  cart?: {
    cartItems: CartItem[];
    loading: boolean;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    getCartTotal: () => number;
    getCartCount: () => number;
  };
}

interface OrderConfirmation {
  items: CartItem[];
  total: number;
  deliveryCharges: number;
  customerName: string;
  orderDate: string;
}

const OrderConfirmationScreen = ({ 
  order, 
  onClose 
}: { 
  order: OrderConfirmation; 
  onClose: () => void;
}) => {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-6">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">Order Sent!</h3>
        <p className="text-muted-foreground text-sm">
          Hi {order.customerName}, your order has been sent via WhatsApp
        </p>
      </div>

      <div className="w-full bg-secondary/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="w-4 h-4 text-primary" />
          <span>Order Summary</span>
        </div>
        
        <div className="space-y-2 text-sm">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-muted-foreground">
                {item.product_name} ({item.variant_name}) × {item.quantity}
              </span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{order.total}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>₹{order.deliveryCharges}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-1">
              <span>Total</span>
              <span className="text-primary">₹{order.total + order.deliveryCharges}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-primary/10 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Phone className="w-4 h-4" />
          <span>What's Next?</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Our team will confirm your order on WhatsApp shortly. You'll receive payment details and delivery timeline.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Order placed on {order.orderDate}
      </p>

      <Button onClick={onClose} className="w-full">
        Continue Shopping
      </Button>
    </div>
  );
};

export const CartSheet = ({ userId, cart }: CartSheetProps) => {
  const cartItems = cart?.cartItems ?? [];
  const loading = cart?.loading ?? false;
  const updateQuantity = cart?.updateQuantity ?? (async () => {});
  const removeFromCart = cart?.removeFromCart ?? (async () => {});
  const clearCart = cart?.clearCart ?? (async () => {});
  const getCartTotal = cart?.getCartTotal ?? (() => 0);
  const getCartCount = cart?.getCartCount ?? (() => 0);

  const [showCheckout, setShowCheckout] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);

  const deliveryCharges = 40;
  const finalTotal = getCartTotal() + deliveryCharges;

  const handleOrderPlaced = (customerName: string) => {
    // Store order confirmation data before clearing cart
    setOrderConfirmation({
      items: [...cartItems],
      total: getCartTotal(),
      deliveryCharges,
      customerName,
      orderDate: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    });
    clearCart();
    setShowCheckout(false);
  };

  const handleClose = () => {
    setOrderConfirmation(null);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setShowCheckout(false);
        setOrderConfirmation(null);
      }
    }}>
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
          <SheetTitle className="flex items-center gap-2">
            {showCheckout && !orderConfirmation && (
              <button
                onClick={() => setShowCheckout(false)}
                className="p-1 hover:bg-secondary rounded-full transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {orderConfirmation 
              ? "Order Confirmed" 
              : showCheckout 
                ? "Checkout" 
                : `Your Cart (${getCartCount()} items)`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          {orderConfirmation ? (
            <div className="flex-1 overflow-auto">
              <OrderConfirmationScreen 
                order={orderConfirmation} 
                onClose={handleClose} 
              />
            </div>
          ) : showCheckout ? (
            <div className="flex-1 overflow-auto">
              <WhatsAppCheckout
                cartItems={cartItems}
                cartTotal={getCartTotal()}
                deliveryCharges={deliveryCharges}
                onOrderPlaced={handleOrderPlaced}
              />
            </div>
          ) : (
            <>
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
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};