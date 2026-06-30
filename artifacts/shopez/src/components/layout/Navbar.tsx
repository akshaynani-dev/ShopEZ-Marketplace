import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { TrendingUp, LayoutDashboard, LogOut, Wallet, ClipboardList, BarChart2 } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-foreground ${location === href ? "text-foreground" : "text-muted-foreground"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">ShopEZ</span>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Trade</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navLink("/", "Home")}
            {navLink("/market", "Market")}
            {user && navLink("/portfolio", "Portfolio")}
            {user && navLink("/transactions", "History")}
            {user?.role === "admin" && navLink("/admin", "Admin")}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.virtualBalance !== undefined && (
                <div className="hidden md:flex items-center gap-1.5 text-sm font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full">
                  <Wallet className="h-3.5 w-3.5" />
                  ${user.virtualBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
              <div className="flex items-center gap-2 border-l pl-3 ml-1">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {user && (
        <div className="md:hidden border-t flex items-center gap-4 px-4 py-2 overflow-x-auto">
          <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <BarChart2 className="h-3.5 w-3.5" /> Home
          </Link>
          <Link href="/market" className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <TrendingUp className="h-3.5 w-3.5" /> Market
          </Link>
          <Link href="/portfolio" className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Wallet className="h-3.5 w-3.5" /> Portfolio
          </Link>
          <Link href="/transactions" className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <ClipboardList className="h-3.5 w-3.5" /> History
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
