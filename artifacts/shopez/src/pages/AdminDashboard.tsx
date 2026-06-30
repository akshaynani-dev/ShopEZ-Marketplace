import { useState } from "react";
import { useAdminGetUsers, useAdminGetStocks, useAdminGetTransactions, useAdminUpdateBalance, useAdminDeleteStock, useAdminCreateStock, useAdminSeed, getAdminGetUsersQueryKey, getAdminGetStocksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Users, BarChart2, ClipboardList, Trash2, Plus, RefreshCw } from "lucide-react";

type TabKey = "users" | "stocks" | "transactions";

export function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("users");
  const { data: users } = useAdminGetUsers();
  const { data: stocks } = useAdminGetStocks();
  const { data: txs } = useAdminGetTransactions();
  const updateBalance = useAdminUpdateBalance();
  const deleteStock = useAdminDeleteStock();
  const createStock = useAdminCreateStock();
  const seed = useAdminSeed();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editBalance, setEditBalance] = useState<{ id: string; val: string } | null>(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: "", name: "", price: "", previousClose: "", sector: "", description: "" });

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSaveBalance = (userId: string) => {
    const val = parseFloat(editBalance?.val ?? "");
    if (isNaN(val) || val < 0) return;
    updateBalance.mutate(
      { userId, data: { virtualBalance: val } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
          setEditBalance(null);
          toast({ title: "Balance updated" });
        },
      },
    );
  };

  const handleDeleteStock = (symbol: string) => {
    if (!confirm(`Delete ${symbol}?`)) return;
    deleteStock.mutate(
      { symbol },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetStocksQueryKey() });
          toast({ title: `${symbol} deleted` });
        },
      },
    );
  };

  const handleAddStock = () => {
    const price = parseFloat(newStock.price);
    const prev = parseFloat(newStock.previousClose) || price;
    if (!newStock.symbol || !newStock.name || isNaN(price) || !newStock.sector) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createStock.mutate(
      { data: { symbol: newStock.symbol.toUpperCase(), name: newStock.name, price, previousClose: prev, sector: newStock.sector, description: newStock.description } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetStocksQueryKey() });
          setShowAddStock(false);
          setNewStock({ symbol: "", name: "", price: "", previousClose: "", sector: "", description: "" });
          toast({ title: "Stock added" });
        },
      },
    );
  };

  const handleSeed = () => {
    seed.mutate(undefined, {
      onSuccess: (d) => {
        queryClient.invalidateQueries({ queryKey: getAdminGetStocksQueryKey() });
        toast({ title: "Seeded", description: d.message });
      },
    });
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" />, count: users?.length },
    { key: "stocks", label: "Stocks", icon: <BarChart2 className="h-4 w-4" />, count: stocks?.length },
    { key: "transactions", label: "Transactions", icon: <ClipboardList className="h-4 w-4" />, count: txs?.length },
  ];

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, stocks, and trades</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={seed.isPending} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${seed.isPending ? "animate-spin" : ""}`} />
            Seed Data
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Users */}
        {tab === "users" && (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editBalance?.id === u.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Input className="h-7 w-28 text-right text-xs" value={editBalance.val} onChange={(e) => setEditBalance({ ...editBalance, val: e.target.value })} />
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveBalance(u.id)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditBalance(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <span className="font-medium">{fmt(u.virtualBalance)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editBalance?.id !== u.id && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditBalance({ id: u.id, val: String(u.virtualBalance) })}>
                          Edit Balance
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stocks */}
        {tab === "stocks" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="gap-2" onClick={() => setShowAddStock(!showAddStock)}>
                <Plus className="h-3.5 w-3.5" /> Add Stock
              </Button>
            </div>

            {showAddStock && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="font-semibold">Add New Stock</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-muted-foreground">Symbol *</label><Input className="mt-1 uppercase" placeholder="AAPL" value={newStock.symbol} onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })} /></div>
                  <div><label className="text-xs text-muted-foreground">Name *</label><Input className="mt-1" placeholder="Apple Inc." value={newStock.name} onChange={(e) => setNewStock({ ...newStock, name: e.target.value })} /></div>
                  <div><label className="text-xs text-muted-foreground">Sector *</label><Input className="mt-1" placeholder="Technology" value={newStock.sector} onChange={(e) => setNewStock({ ...newStock, sector: e.target.value })} /></div>
                  <div><label className="text-xs text-muted-foreground">Price *</label><Input className="mt-1" type="number" placeholder="150.00" value={newStock.price} onChange={(e) => setNewStock({ ...newStock, price: e.target.value })} /></div>
                  <div><label className="text-xs text-muted-foreground">Prev Close</label><Input className="mt-1" type="number" placeholder="148.00" value={newStock.previousClose} onChange={(e) => setNewStock({ ...newStock, previousClose: e.target.value })} /></div>
                  <div><label className="text-xs text-muted-foreground">Description</label><Input className="mt-1" placeholder="Company description..." value={newStock.description} onChange={(e) => setNewStock({ ...newStock, description: e.target.value })} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddStock} disabled={createStock.isPending}>Add Stock</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddStock(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Name</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Change</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stocks?.map((s) => {
                    const pos = s.changePercent >= 0;
                    return (
                      <tr key={s.symbol} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold">{s.symbol}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.name}</td>
                        <td className="px-4 py-3 text-right">${s.price.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right ${pos ? "text-emerald-500" : "text-red-500"}`}>
                          <span className="flex items-center justify-end gap-1">
                            {pos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {pos ? "+" : ""}{s.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => handleDeleteStock(s.symbol)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions */}
        {tab === "transactions" && (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {txs?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{tx.userId.slice(-8)}</td>
                    <td className="px-4 py-3 font-semibold">{tx.symbol}</td>
                    <td className="px-4 py-3">
                      <Badge className={tx.type === "buy" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {tx.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-right px-4 py-3 hidden sm:table-cell">{tx.quantity}</td>
                    <td className="text-right px-4 py-3 font-medium">{fmt(tx.total)}</td>
                    <td className="text-right px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!txs?.length && <p className="text-center py-8 text-muted-foreground">No transactions yet</p>}
          </div>
        )}
      </div>
    </Layout>
  );
}
