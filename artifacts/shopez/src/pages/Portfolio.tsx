import { useGetPortfolio } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, TrendingDown, Wallet, BarChart2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${positive === undefined ? "" : positive ? "text-emerald-500" : "text-red-500"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function Portfolio() {
  const { data, isLoading } = useGetPortfolio();
  const { user } = useAuth();

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="rounded-xl border bg-muted/40 h-24 animate-pulse" />)}
          </div>
        </div>
      </Layout>
    );
  }

  const totalPortfolioValue = (data?.totalValue ?? 0) + (data?.cashBalance ?? 0);

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Portfolio</h1>
          <p className="text-muted-foreground">Your investment overview, {user?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Account Value" value={fmt(totalPortfolioValue)} />
          <StatCard label="Cash Balance" value={fmt(data?.cashBalance ?? 0)} />
          <StatCard label="Invested Value" value={fmt(data?.totalValue ?? 0)} />
          <StatCard label="Total Invested" value={fmt(data?.totalInvested ?? 0)} />
          <StatCard
            label="Profit / Loss"
            value={fmt(data?.totalProfitLoss ?? 0)}
            sub={pct(data?.totalProfitLossPercent ?? 0)}
            positive={(data?.totalProfitLoss ?? 0) >= 0}
          />
        </div>

        {/* Holdings */}
        {data?.holdings.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-lg mb-1">No holdings yet</p>
            <p className="text-muted-foreground text-sm mb-4">Start trading to build your portfolio</p>
            <Link href="/market"><Button>Browse Market</Button></Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4">Holdings</h2>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Shares</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Avg Buy</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Current</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Value</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.holdings.map((h) => {
                    const isPos = h.profitLoss >= 0;
                    return (
                      <tr key={h.symbol} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/stocks/${h.symbol}`} className="hover:underline">
                            <span className="font-semibold">{h.symbol}</span>
                            <span className="text-muted-foreground ml-2 hidden sm:inline">{h.stockName}</span>
                          </Link>
                        </td>
                        <td className="text-right px-4 py-3 hidden md:table-cell">{h.quantity}</td>
                        <td className="text-right px-4 py-3 hidden md:table-cell">{fmt(h.avgBuyPrice)}</td>
                        <td className="text-right px-4 py-3">{fmt(h.currentPrice)}</td>
                        <td className="text-right px-4 py-3 font-medium">{fmt(h.currentValue)}</td>
                        <td className={`text-right px-4 py-3 font-medium ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                          <div className="flex items-center justify-end gap-1">
                            {isPos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {fmt(h.profitLoss)}
                          </div>
                          <div className="text-xs">{pct(h.profitLossPercent)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
