import { Layout } from "@/components/layout/Layout";
import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Package, ChevronRight, Truck } from "lucide-react";

export function Orders() {
  const { data: orders, isLoading } = useListOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "processing": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "shipped": return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "delivered": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <Layout>
      <div className="pb-16 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse"></div>)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Link href="/products">
              <Button variant="outline">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                <Card className="hover:shadow-md transition-all duration-200 border-border group-hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold">Order #{order.id}</span>
                          <Badge className={`capitalize ${getStatusColor(order.status)}`} variant="secondary">
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Placed on {format(new Date(order.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                          <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {order.items.slice(0, 5).map(item => (
                        <div key={item.productId} className="w-16 h-16 shrink-0 rounded-md bg-muted/50 overflow-hidden relative">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 m-auto mt-5 text-muted-foreground opacity-20" />
                          )}
                          {item.quantity > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 font-bold">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 5 && (
                        <div className="w-16 h-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-sm font-medium">
                          +{order.items.length - 5}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { Button } from "@/components/ui/button";
