import { Link } from "wouter";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Stock } from "@workspace/api-client-react";

interface StockCardProps {
  stock: Stock;
}

export function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <Link href={`/stocks/${stock.symbol}`}>
      <div className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {stock.symbol}
            </span>
            <p className="mt-1.5 font-semibold text-sm line-clamp-1">{stock.name}</p>
          </div>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
          )}
        </div>

        <div className="flex items-end justify-between">
          <span className="text-xl font-bold">${stock.price.toFixed(2)}</span>
          <div className={`text-right ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
            <p className="text-sm font-semibold">
              {isPositive ? "+" : ""}
              {stock.change.toFixed(2)}
            </p>
            <p className="text-xs">
              {isPositive ? "+" : ""}
              {stock.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">{stock.sector}</div>
      </div>
    </Link>
  );
}
