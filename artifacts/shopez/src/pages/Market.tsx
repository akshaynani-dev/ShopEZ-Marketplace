import { useState } from "react";
import { useGetStocks } from "@workspace/api-client-react";
import { StockCard } from "@/components/StockCard";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const SORT_OPTIONS = [
  { value: "change_desc", label: "Top Gainers" },
  { value: "change_asc", label: "Top Losers" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "name_asc", label: "A – Z" },
];

export function Market() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [sort, setSort] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useGetStocks({
    q: debouncedQuery || undefined,
    sector: sector || undefined,
    sort: sort as never || undefined,
  });

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Market</h1>
          <p className="text-muted-foreground">Browse all available stocks and start trading</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by symbol or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Sectors</option>
            {data?.sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Default Sort</option>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {(query || sector || sort) && (
            <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setSector(""); setSort(""); }}>
              Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-muted/40 h-32 animate-pulse" />
            ))}
          </div>
        ) : data?.stocks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No stocks found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{data?.stocks.length} stocks found</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.stocks.map((s) => <StockCard key={s.symbol} stock={s} />)}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
