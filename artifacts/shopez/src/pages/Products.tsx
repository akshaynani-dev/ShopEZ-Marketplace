import { Layout } from "@/components/layout/Layout";
import { useListProducts, getListProductsQueryKey, useGetCategories } from "@workspace/api-client-react";
import type { ListProductsSort } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useSearch } from "wouter";
import { Star, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";

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
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-card hover:bg-accent/5">
                  <div className="aspect-square relative overflow-hidden bg-muted/20">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    {product.discountPercent > 0 && (
                      <Badge variant="destructive" className="absolute top-3 left-3">
                        {product.discountPercent}% OFF
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="text-xs font-medium text-muted-foreground mb-2">{product.category}</div>
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                      {product.discountPercent > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${(product.price / (1 - product.discountPercent / 100)).toFixed(2)}
                        </span>
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
