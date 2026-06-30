import { useGetTransactions } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export function Transactions() {
  const { data: txs, isLoading } = useGetTransactions();

  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Transaction History</h1>
          <p className="text-muted-foreground">All your buy and sell activity</p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-muted/40 h-16 animate-pulse" />
            ))}
          </div>
        ) : txs?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No transactions yet</p>
            <p className="text-sm mt-1">
              <Link href="/market" className="text-primary hover:underline">Browse the market</Link> and make your first trade
            </p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {txs?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/stocks/${tx.symbol}`} className="hover:underline">
                        <span className="font-semibold">{tx.symbol}</span>
                        <span className="text-muted-foreground ml-2 hidden sm:inline text-xs">{tx.stockName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={tx.type === "buy" ? "default" : "secondary"}
                        className={tx.type === "buy" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}
                      >
                        {tx.type === "buy" ? (
                          <><TrendingUp className="h-3 w-3 mr-1" /> BUY</>
                        ) : (
                          <><TrendingDown className="h-3 w-3 mr-1" /> SELL</>
                        )}
                      </Badge>
                    </td>
                    <td className="text-right px-4 py-3 hidden sm:table-cell">{tx.quantity}</td>
                    <td className="text-right px-4 py-3 hidden md:table-cell">{fmt(tx.price)}</td>
                    <td className="text-right px-4 py-3 font-medium">{fmt(tx.total)}</td>
                    <td className="text-right px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
