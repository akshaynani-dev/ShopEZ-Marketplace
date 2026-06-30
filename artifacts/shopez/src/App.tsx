import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import { Market } from "@/pages/Market";
import { StockDetail } from "@/pages/StockDetail";
import { Portfolio } from "@/pages/Portfolio";
import { Transactions } from "@/pages/Transactions";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/market" component={Market} />
      <Route path="/stocks/:symbol" component={StockDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/portfolio">
        <ProtectedRoute allowedRoles={["user", "admin"]}><Portfolio /></ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute allowedRoles={["user", "admin"]}><Transactions /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
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
