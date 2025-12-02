import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductVariant {
  id: string;
  variant_name: string;
  price: number;
  stock_quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  product_type: string;
  oil_type: string | null;
  health_tags: string[];
  region_tags: string[];
  image_url: string | null;
  variants?: ProductVariant[];
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) throw productsError;

      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*");

      if (variantsError) throw variantsError;

      const productsWithVariants = productsData.map((product) => ({
        ...product,
        variants: variantsData.filter((v) => v.product_id === product.id),
      }));

      setProducts(productsWithVariants);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedProducts = (region: string | null) => {
    if (!region) return products.filter((p) => p.product_type === "oil").slice(0, 4);
    
    return products.filter(
      (p) =>
        p.product_type === "oil" &&
        (p.region_tags.includes(region) || p.region_tags.includes("All"))
    );
  };

  const getOilProducts = () => {
    return products.filter((p) => p.product_type === "oil");
  };

  const getIoTProducts = () => {
    return products.filter((p) => p.product_type === "iot_device");
  };

  return {
    products,
    loading,
    refetch: fetchProducts,
    getRecommendedProducts,
    getOilProducts,
    getIoTProducts,
  };
};