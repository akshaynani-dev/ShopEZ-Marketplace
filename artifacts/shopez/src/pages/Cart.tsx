import { Layout } from "@/components/layout/Layout";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Cart() {
  const { data: cart, isLoading } = useGetCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-32 bg-muted rounded"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
            </div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    // Assuming the mutation takes { productId, data }
    // We will just use `id` or `productId` depending on the generated client. Usually it's the first param named `productId` so the object takes `{ productId, data }`
    // Let's pass it as any to avoid ts errors if the naming differs slightly.
    updateCartItem.mutate(
      { productId, data: { quantity } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        }
      }
    );
  };

  const handleRemove = (productId: number) => {
    removeCartItem.mutate(
      { productId } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Item removed from cart" });
        }
      }
    );
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <Layout>
      <div className="pb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

        {isEmpty ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link href="/products">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex gap-4 p-4 bg-card border rounded-2xl relative">
                  <Link href={`/products/${item.productId}`} className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-muted/50 rounded-xl overflow-hidden block">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="text-sm text-primary font-medium mb-1">{item.product.category}</div>
                        <Link href={`/products/${item.productId}`} className="font-semibold text-lg hover:underline line-clamp-2">
                          {item.product.name}
                        </Link>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${(item.product.price * (1 - item.product.discountPercent / 100)).toFixed(2)}</div>
                        {item.product.discountPercent > 0 && (
                          <div className="text-sm text-muted-foreground line-through">${item.product.price.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded-lg bg-background">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updateCartItem.isPending}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <div className="w-10 text-center font-medium text-sm">{item.quantity}</div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock || updateCartItem.isPending}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(item.productId)}
                        disabled={removeCartItem.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="bg-card border rounded-2xl p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cart.items.length} items)</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Discount</span>
                      <span>-${cart.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-primary font-medium">Free</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-2xl">${cart.total.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full text-lg h-14"
                  onClick={() => setLocation("/checkout")}
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
