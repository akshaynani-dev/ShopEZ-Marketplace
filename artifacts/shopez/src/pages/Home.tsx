import { Link } from "wouter";
import { useGetMovers, useGetStocks } from "@workspace/api-client-react";
import { StockCard } from "@/components/StockCard";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Home() {
  const { data: movers, isLoading: moversLoading } = useGetMovers();
  const { data: stocksData } = useGetStocks();
  const { user } = useAuth();

  const totalStocks = stocksData?.stocks.length ?? 0;
  const avgChange =
    totalStocks > 0
      ? (stocksData?.stocks.reduce((s, x) => s + x.changePercent, 0) ?? 0) / totalStocks
      : 0;
  const gainers = stocksData?.stocks.filter((s) => s.changePercent > 0).length ?? 0;

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background border-b">
        <div className="container py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              <BarChart2 className="h-3.5 w-3.5" />
              Virtual Stock Trading Platform
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Trade Smarter with <span className="text-primary">ShopEZ</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Explore real-world stocks, track market trends, and practice trading with $100,000 in virtual funds — risk-free.
            </p>
            <div className="flex flex-wrap gap-3">
              {!user ? (
                <>
                  <Link href="/register"><Button size="lg">Start Trading Free</Button></Link>
                  <Link href="/market"><Button variant="outline" size="lg">Explore Market</Button></Link>
                </>
              ) : (
                <>
                  <Link href="/market"><Button size="lg">Browse Market</Button></Link>
                  <Link href="/portfolio"><Button variant="outline" size="lg">My Portfolio</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10 space-y-12">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Listed Stocks</p>
            <p className="text-2xl font-bold">{totalStocks}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Advancing</p>
            <p className="text-2xl font-bold text-emerald-500">{gainers}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Market Avg</p>
            <p className={`text-2xl font-bold ${avgChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </p>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-bold">Top Gainers</h2>
            </div>
            <Link href="/market"><Button variant="ghost" size="sm" className="gap-1">See all <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
          {moversLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="rounded-xl border bg-muted/40 h-28 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {movers?.gainers.map((s) => <StockCard key={s.symbol} stock={s} />)}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-bold">Top Losers</h2>
            </div>
            <Link href="/market"><Button variant="ghost" size="sm" className="gap-1">See all <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {movers?.losers.map((s) => <StockCard key={s.symbol} stock={s} />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All Stocks</h2>
            <Link href="/market"><Button variant="ghost" size="sm" className="gap-1">View market <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {stocksData?.stocks.slice(0, 8).map((s) => <StockCard key={s.symbol} stock={s} />)}
          </div>
        </section>
      </div>
    </Layout>
  );
}
