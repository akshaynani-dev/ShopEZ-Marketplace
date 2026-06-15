import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserRole, useGetSellerStats, useGetSellerSales, useGetTopProducts, useListSellerOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { DollarSign, ShoppingBag, PackageOpen, ArrowUpRight, TrendingUp, Package, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function SellerDashboard() {
  const { data: stats } = useGetSellerStats();
  const { data: salesData } = useGetSellerSales({ period: '30d' });
  const { data: topProducts } = useGetTopProducts();
  const { data: recentOrders } = useListSellerOrders();

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

  return (
    <ProtectedRoute allowedRoles={['seller' as UserRole]}>
      <Layout>
        <div className="pb-16 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
              <p className="text-muted-foreground">Overview of your store's performance.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/seller/products">
                <Button variant="outline" className="gap-2"><Package className="w-4 h-4" /> Products</Button>
              </Link>
              <Link href="/seller/orders">
                <Button className="gap-2"><ShoppingBag className="w-4 h-4" /> Manage Orders</Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1 text-green-600 font-medium">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stats?.revenueGrowth || 0}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.pendingOrders || 0} orders pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats?.avgOrderValue?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <PackageOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In your catalog
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-7">
            {/* Chart */}
            <Card className="md:col-span-4 lg:col-span-5">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Daily revenue for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                        style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                        style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                        labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "var(--background)", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="md:col-span-3 lg:col-span-2 flex flex-col">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Highest revenue generators</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-6">
                  {topProducts?.map(product => (
                    <div key={product.productId} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted/50 overflow-hidden shrink-0">
                        {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.totalSold} sold
                        </p>
                      </div>
                      <div className="font-semibold text-sm">
                        ${product.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {(!topProducts || topProducts.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No sales data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your store</CardDescription>
              </div>
              <Link href="/seller/orders">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders?.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {order.buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">Order #{order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.length} items • {format(new Date(order.createdAt), "MMM d")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge className={`capitalize ${getStatusColor(order.status)}`} variant="secondary">
                        {order.status}
                      </Badge>
                      <div className="font-bold whitespace-nowrap">${order.total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </Layout>
    </ProtectedRoute>
  );
}
