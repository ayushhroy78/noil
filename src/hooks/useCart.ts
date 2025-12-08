import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  product_name: string;
  variant_name: string;
  price: number;
  oil_type?: string;
}

export const useCart = (userId: string | undefined) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          products (name, oil_type),
          product_variants (variant_name, price)
        `)
        .eq("user_id", userId);

      if (error) throw error;

      const formattedItems = data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        product_name: item.products.name,
        variant_name: item.product_variants.variant_name,
        price: item.product_variants.price,
        oil_type: item.products.oil_type,
      }));

      setCartItems(formattedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!userId) return;

    fetchCart();

    // Subscribe to realtime changes for this user's cart
    const channel = supabase
      .channel(`cart-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch cart on any change (INSERT, UPDATE, DELETE)
          fetchCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCart]);

  const addToCart = async (productId: string, variantId: string) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("variant_id", variantId)
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase.from("cart_items").insert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId,
          quantity: 1,
        });

        if (error) throw error;
      }

      toast({
        title: "Added to Cart",
        description: "Item successfully added to your cart",
      });

      fetchCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;

      setCartItems((items) =>
        items.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setCartItems((items) => items.filter((item) => item.id !== itemId));

      toast({
        title: "Removed",
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    refetch: fetchCart,
  };
}