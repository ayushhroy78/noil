import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Product, ProductVariant } from "@/hooks/useProducts";
import { useState } from "react";
import mustardOilImg from "@/assets/mustard-oil.jpg";
import coconutOilImg from "@/assets/coconut-oil.jpg";
import sesameOilImg from "@/assets/sesame-oil.jpg";
import groundnutOilImg from "@/assets/groundnut-oil.jpg";

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, variantId: string) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants?.[0]!
  );

  const imageMap: Record<string, string> = {
    "Cold-Pressed Mustard Oil": mustardOilImg,
    "Coconut Oil": coconutOilImg,
    "Sesame Oil": sesameOilImg,
    "Groundnut Oil": groundnutOilImg,
  };

  const productImage = imageMap[product.name];

  return (
    <Card className="p-4 space-y-3 hover:shadow-lg transition-shadow">
      {productImage && (
        <div className="w-full h-48 overflow-hidden rounded-lg">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.description}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {product.health_tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {product.variants && product.variants.length > 0 && (
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

      {product.product_type === "iot_device" && (
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
      )}
    </Card>
  );
};