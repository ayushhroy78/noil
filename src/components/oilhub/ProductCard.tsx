import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye } from "lucide-react";
import { Product, ProductVariant } from "@/hooks/useProducts";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import mustardOil from "@/assets/mustard-oil.jpg";
import groundnutOil from "@/assets/groundnut-oil.jpg";
import coconutOil from "@/assets/coconut-oil.jpg";
import sesameOil from "@/assets/sesame-oil.jpg";
import riceBranOil from "@/assets/rice-bran-oil.jpg";
import oliveOil from "@/assets/olive-oil.jpg";
import iotOilDispenser from "@/assets/iot-oil-dispenser.png";

const oilImageMap: Record<string, string> = {
  mustard: mustardOil,
  groundnut: groundnutOil,
  coconut: coconutOil,
  sesame: sesameOil,
  "rice bran": riceBranOil,
  rice: riceBranOil,
  olive: oliveOil,
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, variantId: string) => void;
}

const getProductImage = (product: Product): string | null => {
  if (product.image_url) return product.image_url;
  
  // Use IoT device image for IoT products
  if (product.product_type === "iot_device") {
    return iotOilDispenser;
  }
  
  // Try to match oil type to local images
  const oilType = product.oil_type?.toLowerCase() || product.name.toLowerCase();
  for (const [key, image] of Object.entries(oilImageMap)) {
    if (oilType.includes(key)) {
      return image;
    }
  }
  return null;
};

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants?.[0]!
  );
  
  const productImage = getProductImage(product);
  const isIoTDevice = product.product_type === "iot_device";

  const handleViewDetails = () => {
    navigate(`/oilhub/product/${product.id}`);
  };

  return (
    <Card className="p-4 space-y-3 hover:shadow-lg transition-shadow">
      {productImage && (
        <div 
          className="w-full h-48 overflow-hidden rounded-lg cursor-pointer relative group"
          onClick={handleViewDetails}
        >
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isIoTDevice && (
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-3 py-1 rounded-full text-sm font-medium text-foreground">
                View Details
              </span>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        <h3 
          className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={handleViewDetails}
        >
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {product.health_tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {product.variants && product.variants.length > 0 && !isIoTDevice && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedVariant.id === variant.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {variant.variant_name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">
              ₹{selectedVariant.price}
            </span>
            <Button
              size="sm"
              onClick={() => onAddToCart(product.id, selectedVariant.id)}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      )}

      {isIoTDevice && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">
              ₹{selectedVariant?.price}
            </span>
            <Badge variant="outline" className="text-xs">
              IoT Enabled
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewDetails}
              className="gap-2 flex-1"
            >
              <Eye className="w-4 h-4" />
              Details
            </Button>
            <Button
              size="sm"
              onClick={() => selectedVariant && onAddToCart(product.id, selectedVariant.id)}
              className="gap-2 flex-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};