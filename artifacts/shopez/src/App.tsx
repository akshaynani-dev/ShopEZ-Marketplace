import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Products } from "@/pages/Products";
import { ProductDetail } from "@/pages/ProductDetail";
import { Cart } from "@/pages/Cart";
import { Checkout } from "@/pages/Checkout";
import { Orders } from "@/pages/Orders";
import { OrderDetail } from "@/pages/OrderDetail";
import { SellerDashboard } from "@/pages/SellerDashboard";
import { SellerProducts } from "@/pages/SellerProducts";
import { SellerOrders } from "@/pages/SellerOrders";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      
      {/* Protected Buyer Routes */}
      <Route path="/cart">
        <ProtectedRoute allowedRoles={["buyer"]}><Cart /></ProtectedRoute>
      </Route>
      <Route path="/checkout">
        <ProtectedRoute allowedRoles={["buyer"]}><Checkout /></ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute allowedRoles={["buyer"]}><Orders /></ProtectedRoute>
      </Route>
      <Route path="/orders/:id">
        <ProtectedRoute allowedRoles={["buyer"]}><OrderDetail /></ProtectedRoute>
      </Route>

      {/* Protected Seller Routes */}
      <Route path="/seller">
        <SellerDashboard />
      </Route>
      <Route path="/seller/products">
        <SellerProducts />
      </Route>
      <Route path="/seller/orders">
        <SellerOrders />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
