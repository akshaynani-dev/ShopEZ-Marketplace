import { Layout } from "@/components/layout/Layout";
import { useGetOrder } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ChevronLeft, Package, MapPin, CreditCard, Clock, Truck, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = Number(params?.id);
  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: !!id } });

  if (isLoading || !order) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded-2xl"></div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-96 bg-muted rounded-2xl"></div>
            <div className="h-64 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const timelineSteps = [
    { status: "pending", icon: Clock, label: "Order Placed" },
    { status: "processing", icon: Package, label: "Processing" },
    { status: "shipped", icon: Truck, label: "Shipped" },
    { status: "delivered", icon: CheckCircle2, label: "Delivered" },
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.status === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <Layout>
      <div className="pb-16 max-w-4xl mx-auto">
        <Link href="/orders" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to orders
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Order #{order.id}</h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge className={`capitalize text-sm px-3 py-1 ${getStatusColor(order.status)}`} variant="secondary">
            {order.status}
          </Badge>
        </div>

        {!isCancelled && (
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, (currentStepIndex / (timelineSteps.length - 1)) * 100)}%` }}
                />
                <div className="relative flex justify-between">
                  {timelineSteps.map((step, i) => {
                    const isCompleted = currentStepIndex >= i;
                    const isCurrent = currentStepIndex === i;
                    const Icon = step.icon;
                    return (
                      <div key={step.status} className="flex flex-col items-center gap-3 relative bg-card px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${
                          isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-card border-muted text-muted-foreground"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <Link href={`/products/${item.productId}`} className="w-20 h-20 shrink-0 rounded-lg bg-muted/50 overflow-hidden block">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />}
                    </Link>
                    <div className="flex-1 flex flex-col justify-between">
                      <Link href={`/products/${item.productId}`} className="font-medium hover:underline line-clamp-2">
                        {item.productName}
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-end">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-xl">${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm mb-1">Shipping Address</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {order.shippingAddress}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
