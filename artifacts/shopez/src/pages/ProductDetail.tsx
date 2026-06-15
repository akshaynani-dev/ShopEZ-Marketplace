import { Layout } from "@/components/layout/Layout";
import { useGetProduct, getGetProductQueryKey, useAddCartItem, getGetCartQueryKey, useListReviews } from "@workspace/api-client-react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, Truck, ShieldCheck, ChevronLeft, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = Number(params?.id);
  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id } });
  const { data: reviews } = useListReviews(id, { query: { enabled: !!id } });
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddCartItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading || !product) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-24 bg-muted rounded"></div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-muted rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-32 bg-muted rounded w-full"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    
    addToCart.mutate(
      { data: { productId: product.id, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({
            title: "Added to cart",
            description: `${quantity}x ${product.name} has been added to your cart.`,
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="pb-16">
        <Link href="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to products
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-16">
          <div className="aspect-square relative rounded-3xl overflow-hidden bg-muted/20 border">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
            {product.discountPercent > 0 && (
              <Badge variant="destructive" className="absolute top-4 left-4 text-sm px-3 py-1">
                {product.discountPercent}% OFF
              </Badge>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-2 text-primary font-medium">{product.category}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">({product.reviewCount} reviews)</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Sold by <span className="font-medium text-foreground">{product.sellerName}</span></span>
            </div>

            <div className="flex items-end gap-3 mb-8">
              <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
              {product.discountPercent > 0 && (
                <span className="text-xl text-muted-foreground line-through mb-1">
                  ${(product.price / (1 - product.discountPercent / 100)).toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            <Separator className="mb-8" />

            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity</span>
                <div className="flex items-center border rounded-lg bg-card">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="w-12 text-center font-medium">{quantity}</div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-none"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.stock} available
                </span>
              </div>

              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="flex-1 h-14 text-lg"
                  disabled={isOutOfStock || addToCart.isPending}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 text-sm">
                <Truck className="w-5 h-5 text-primary" />
                <span className="font-medium">Free Shipping</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 text-sm">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-medium">Buyer Protection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>
          {reviews?.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-dashed text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews?.map(review => (
                <div key={review.id} className="p-6 bg-card rounded-xl border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold">{review.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(review.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
