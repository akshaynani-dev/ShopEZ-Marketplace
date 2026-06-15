import { Layout } from "@/components/layout/Layout";
import { useGetFeaturedProducts, useGetCategories } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Star, ShoppingBag, TrendingUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Home() {
  const { data: featuredProducts, isLoading: loadingFeatured } = useGetFeaturedProducts();
  const { data: categories, isLoading: loadingCategories } = useGetCategories();

  return (
    <Layout>
      <div className="flex flex-col gap-16 pb-16">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-primary/5 px-6 py-24 md:px-12 md:py-32 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:20px_20px]" />
          <Badge variant="secondary" className="mb-6 z-10 font-medium">
            Next Generation Marketplace
          </Badge>
          <h1 className="z-10 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Effortless shopping.<br />
            <span className="text-primary">Powerful selling.</span>
          </h1>
          <p className="z-10 mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Discover premium products from verified sellers, or open your own storefront and reach thousands of customers today.
          </p>
          <div className="z-10 mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/products">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Shopping
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm">
                Become a Seller
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-muted/50 border-none">
            <CardContent className="pt-6">
              <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Curated Selection</h3>
              <p className="text-muted-foreground text-sm">Explore thousands of high-quality products handpicked for you.</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-none">
            <CardContent className="pt-6">
              <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Seller Dashboard</h3>
              <p className="text-muted-foreground text-sm">Powerful analytics and inventory management to grow your business.</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-none">
            <CardContent className="pt-6">
              <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure Checkout</h3>
              <p className="text-muted-foreground text-sm">Safe, fast, and reliable payments with buyer protection.</p>
            </CardContent>
          </Card>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
            <Link href="/products">
              <Button variant="ghost" className="gap-2">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.map(product => (
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
        </section>

      </div>
    </Layout>
  );
}
