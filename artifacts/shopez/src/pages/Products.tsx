import { Layout } from "@/components/layout/Layout";
import { useListProducts, useGetCategories } from "@workspace/api-client-react";
import type { ListProductsSort } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation, useSearch } from "wouter";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { ProductCard } from "@/components/ProductCard";

export function Products() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialCategory = searchParams.get("category") || undefined;
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [sort, setSort] = useState<ListProductsSort | undefined>(undefined);

  const { data: categories } = useGetCategories();
  const { data: productsData, isLoading } = useListProducts({
    category,
    search: debouncedSearch,
    sort,
    limit: 50,
  });

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-16">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">All Products</h1>
          <p className="text-muted-foreground">Discover our entire collection.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.name} ({c.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort || "newest"} onValueChange={(v) => setSort(v as ListProductsSort)}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-[360px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-xl border border-dashed">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            <Button variant="outline" className="mt-6" onClick={() => {
              setSearch("");
              setCategory(undefined);
              setSort(undefined);
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productsData?.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
