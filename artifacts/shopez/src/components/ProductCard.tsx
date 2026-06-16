import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Loader2 } from "lucide-react";
import { useAddCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const addToCart = useAddCartItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isBuyer = user?.role === "buyer";
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setLocation("/login");
      return;
    }

    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
          });
        },
        onError: () => {
          toast({
            title: "Failed to add",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-card hover:bg-accent/5">
        <div className="aspect-square relative overflow-hidden bg-muted/20">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {product.discountPercent > 0 && (
            <Badge variant="destructive" className="absolute top-3 left-3">
              {product.discountPercent}% OFF
            </Badge>
          )}
        </div>
        <CardContent className="p-5">
          <div className="text-xs font-medium text-muted-foreground mb-2">{product.category}</div>
          <h3 className="font-semibold text-lg line-clamp-1 mb-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
              {product.discountPercent > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  ${(product.price / (1 - product.discountPercent / 100)).toFixed(2)}
                </span>
              )}
            </div>
            {(isBuyer || !user) && (
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0 gap-1.5"
                disabled={isOutOfStock || addToCart.isPending}
                onClick={handleAddToCart}
              >
                {addToCart.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3.5 w-3.5" />
                )}
                {isOutOfStock ? "Out of stock" : "Add"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
