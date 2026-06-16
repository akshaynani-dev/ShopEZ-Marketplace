import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { data: cart } = useGetCart({ query: { retry: false, throwOnError: false } as any });

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold inline-block text-xl tracking-tight">ShopEZ</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/products" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Products
            </Link>
            <Link href="/cart" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-3 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === 'seller' ? (
                <Link href="/seller">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Package className="h-4 w-4" />
                      Orders
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="ghost" size="sm" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                          {cartItemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </>
              )}
              <div className="flex items-center gap-2 border-l pl-4 ml-2">
                <span className="text-sm font-medium">{user.name}</span>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Log out</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
