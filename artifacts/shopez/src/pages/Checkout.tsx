import { Layout } from "@/components/layout/Layout";
import { useGetCart, useCreateOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useState } from "react";

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, "Please enter a complete address"),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
});

export function Checkout() {
  const { data: cart, isLoading } = useGetCart();
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: "",
      paymentMethod: "card",
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse h-96 bg-muted rounded-2xl"></div>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    if (success) {
      return (
        <Layout>
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for shopping with ShopEZ. Your order has been placed successfully and is being processed.
            </p>
            <Link href="/orders">
              <Button size="lg" className="w-full">View My Orders</Button>
            </Link>
          </div>
        </Layout>
      );
    }
    setLocation("/cart");
    return null;
  }

  const onSubmit = (values: z.infer<typeof checkoutSchema>) => {
    createOrder.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          setSuccess(true);
          toast({
            title: "Order placed successfully!",
            description: "We'll send you an email with the order details.",
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="pb-16">
        <Link href="/cart" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Return to cart
        </Link>
        
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Form {...form}>
              <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-card border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Apt 4B, New York, NY 10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-card border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="card" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full">
                                <div className="mb-2">💳</div>
                                <span className="text-sm font-medium">Credit Card</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="paypal" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full">
                                <div className="mb-2">🅿️</div>
                                <span className="text-sm font-medium">PayPal</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="apple_pay" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full">
                                <div className="mb-2">🍎</div>
                                <span className="text-sm font-medium">Apple Pay</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-16 h-16 rounded-md bg-muted/50 overflow-hidden shrink-0">
                      {item.product.imageUrl && <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="font-medium line-clamp-2">{item.product.name}</div>
                      <div className="text-muted-foreground mt-1">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold text-sm">
                      ${(item.quantity * item.product.price * (1 - item.product.discountPercent / 100)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mb-6" />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
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
                type="submit" 
                form="checkout-form"
                size="lg" 
                className="w-full text-lg h-14"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
