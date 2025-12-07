import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";

interface WhatsAppCheckoutProps {
  cartItems: CartItem[];
  cartTotal: number;
  deliveryCharges: number;
  onOrderPlaced: (customerName: string) => void;
}

const WHATSAPP_NUMBER = "917892583384";

export const WhatsAppCheckout = ({
  cartItems,
  cartTotal,
  deliveryCharges,
  onOrderPlaced,
}: WhatsAppCheckoutProps) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatOrderMessage = () => {
    const finalTotal = cartTotal + deliveryCharges;
    
    let message = `🛒 *New Order from Noil OilHub*\n\n`;
    message += `👤 *Customer Details:*\n`;
    message += `Name: ${customerName}\n`;
    message += `Phone: ${customerPhone}\n`;
    message += `Address: ${customerAddress}\n\n`;
    message += `📦 *Order Items:*\n`;
    message += `━━━━━━━━━━━━━━━━━\n`;
    
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      message += `   Variant: ${item.variant_name}\n`;
      message += `   Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}\n`;
      if (index < cartItems.length - 1) message += `\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━\n\n`;
    message += `💰 *Order Summary:*\n`;
    message += `Subtotal: ₹${cartTotal}\n`;
    message += `Delivery: ₹${deliveryCharges}\n`;
    message += `*Total: ₹${finalTotal}*\n\n`;
    message += `📅 Order Date: ${new Date().toLocaleString('en-IN')}\n`;
    message += `\n_Sent via Noil App_`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppOrder = () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all customer details",
        variant: "destructive",
      });
      return;
    }

    if (!/^[0-9]{10}$/.test(customerPhone.replace(/\D/g, "").slice(-10))) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const message = formatOrderMessage();
    
    // Direct redirect to WhatsApp using wa.me
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    
    // Redirect to WhatsApp
    window.location.href = whatsappUrl;
    
    // Show confirmation after redirect initiated
    setTimeout(() => {
      setIsSubmitting(false);
      onOrderPlaced(customerName);
    }, 300);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <MessageCircle className="w-5 h-5" />
        <h3 className="font-semibold">Order via WhatsApp</h3>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="customerName">Full Name *</Label>
          <Input
            id="customerName"
            placeholder="Enter your full name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone">Phone Number *</Label>
          <Input
            id="customerPhone"
            type="tel"
            placeholder="10-digit mobile number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="customerAddress">Delivery Address *</Label>
          <Textarea
            id="customerAddress"
            placeholder="Enter full delivery address with pincode"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full gap-2 bg-green-600 hover:bg-green-700"
        onClick={handleWhatsAppOrder}
        disabled={isSubmitting}
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? "Sending..." : "Place Order via WhatsApp"}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        Your order details will be sent to our WhatsApp for confirmation
      </p>
    </div>
  );
};
