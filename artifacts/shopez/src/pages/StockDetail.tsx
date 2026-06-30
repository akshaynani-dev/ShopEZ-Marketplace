import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetStock, useBuyStock, useSellStock, useGetPortfolio, getGetPortfolioQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, ArrowLeft, Building2, DollarSign, BarChart2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: stock, isLoading } = useGetStock(symbol ?? "");
  const { data: portfolio } = useGetPortfolio({ query: { retry: false, throwOnError: false } as any });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const buyMutation = useBuyStock();
  const sellMutation = useSellStock();

  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"buy" | "sell">("buy");

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="h-64 rounded-xl bg-muted/40 animate-pulse mb-4" />
          <div className="h-96 rounded-xl bg-muted/40 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!stock) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-lg text-muted-foreground">Stock not found</p>
          <Link href="/market"><Button className="mt-4">Back to Market</Button></Link>
        </div>
      </Layout>
    );
  }

  const isPositive = stock.change >= 0;
  const holding = portfolio?.holdings.find((h) => h.symbol === stock.symbol);
  const canAfford = (portfolio?.cashBalance ?? 0) >= stock.price * qty;
  const canSell = (holding?.quantity ?? 0) >= qty;
  const total = (stock.price * qty).toFixed(2);

  const handleTrade = () => {
    const mutation = tab === "buy" ? buyMutation : sellMutation;
    mutation.mutate(
      { data: { symbol: stock.symbol, quantity: qty } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({
            title: tab === "buy" ? "Shares purchased!" : "Shares sold!",
            description: `${qty} share${qty > 1 ? "s" : ""} of ${stock.symbol} at $${stock.price.toFixed(2)} each. Balance: $${data.newBalance.toFixed(2)}`,
          });
          setQty(1);
        },
        onError: (err: any) => {
          toast({
            title: "Trade failed",
            description: err?.message ?? (tab === "buy" ? "Insufficient funds" : "Insufficient shares"),
            variant: "destructive",
          });
        },
      },
    );
  };

  const chartData = stock.historicalData.map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: p.price,
  }));

  const minPrice = Math.min(...stock.historicalData.map((p) => p.price));
  const maxPrice = Math.max(...stock.historicalData.map((p) => p.price));
  const padding = (maxPrice - minPrice) * 0.1;

  const fmtNum = (n: number) => n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toLocaleString()}`;

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <Link href="/market" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Market
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded">{stock.symbol}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{stock.sector}</span>
            </div>
            <h1 className="text-3xl font-bold">{stock.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">${stock.price.toFixed(2)}</p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-semibold">{isPositive ? "+" : ""}{stock.change.toFixed(2)}</span>
              <span>({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart + Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold mb-4">30-Day Price History</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    interval={Math.floor(chartData.length / 5)}
                  />
                  <YAxis
                    domain={[minPrice - padding, maxPrice + padding]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                    width={60}
                  />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Info */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h2 className="font-semibold">Company Overview</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{stock.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />Sector</p>
                  <p className="text-sm font-medium mt-0.5">{stock.sector}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Market Cap</p>
                  <p className="text-sm font-medium mt-0.5">{fmtNum(stock.marketCap)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><BarChart2 className="h-3 w-3" />Volume</p>
                  <p className="text-sm font-medium mt-0.5">{(stock.volume / 1e6).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prev Close</p>
                  <p className="text-sm font-medium mt-0.5">${stock.previousClose.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Panel */}
          <div className="space-y-4">
            {user && user.role === "user" ? (
              <div className="rounded-xl border bg-card p-5 sticky top-24">
                <h2 className="font-semibold mb-4">Trade {stock.symbol}</h2>

                {/* Buy/Sell tabs */}
                <div className="grid grid-cols-2 gap-1 bg-muted rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setTab("buy")}
                    className={`rounded-md py-1.5 text-sm font-medium transition-colors ${tab === "buy" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground"}`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTab("sell")}
                    className={`rounded-md py-1.5 text-sm font-medium transition-colors ${tab === "sell" ? "bg-background shadow-sm text-red-500" : "text-muted-foreground"}`}
                  >
                    Sell
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per share</span>
                      <span>${stock.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <span>{qty}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total</span>
                      <span>${total}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Cash Balance</span>
                      <span>${(portfolio?.cashBalance ?? 0).toFixed(2)}</span>
                    </div>
                    {holding && (
                      <div className="flex justify-between">
                        <span>Shares held</span>
                        <span>{holding.quantity}</span>
                      </div>
                    )}
                  </div>

                  {tab === "buy" && !canAfford && (
                    <p className="text-xs text-destructive">Insufficient funds for this trade.</p>
                  )}
                  {tab === "sell" && !canSell && (
                    <p className="text-xs text-destructive">
                      {holding ? `You only have ${holding.quantity} share${holding.quantity > 1 ? "s" : ""}.` : "You don't hold this stock."}
                    </p>
                  )}

                  <Button
                    className={`w-full ${tab === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"} text-white`}
                    onClick={handleTrade}
                    disabled={
                      (tab === "buy" ? (!canAfford || buyMutation.isPending) : (!canSell || sellMutation.isPending))
                    }
                  >
                    {buyMutation.isPending || sellMutation.isPending
                      ? "Processing..."
                      : `${tab === "buy" ? "Buy" : "Sell"} ${qty} Share${qty > 1 ? "s" : ""}`}
                  </Button>
                </div>
              </div>
            ) : !user ? (
              <div className="rounded-xl border bg-card p-5 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Sign in to trade this stock</p>
                <Link href="/login"><Button className="w-full">Sign in</Button></Link>
                <Link href="/register"><Button variant="outline" className="w-full">Create account</Button></Link>
              </div>
            ) : null}

            {/* Quick Stats */}
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Open</span><span>${stock.previousClose.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Current</span><span>${stock.price.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Change</span>
                  <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
                    {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
