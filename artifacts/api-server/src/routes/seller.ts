import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, gte } from "drizzle-orm";
import { GetSellerSalesQueryParams, ListSellerOrdersQueryParams } from "@workspace/api-zod";
import { requireAuth, requireSeller } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

router.get("/seller/stats", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const [productsCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(productsTable)
    .where(eq(productsTable.sellerId, userId));

  // Get all orders and filter by seller's products
  const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const sellerProductIds = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.sellerId, userId));
  const sellerPids = new Set(sellerProductIds.map(p => p.id));

  const sellerOrders = allOrders.filter(o => {
    const items = o.items as Array<{ productId: number }>;
    return items.some(i => sellerPids.has(i.productId));
  });

  let totalRevenue = 0;
  let pendingOrders = 0;
  for (const o of sellerOrders) {
    const items = o.items as Array<{ productId: number; quantity: number; price: number }>;
    const sellerItemsRevenue = items
      .filter(i => sellerPids.has(i.productId))
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
    totalRevenue += sellerItemsRevenue;
    if (o.status === "pending") pendingOrders++;
  }

  const totalOrders = sellerOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // 30-day growth: compare last 30 days vs previous 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const last30 = sellerOrders.filter(o => o.createdAt >= thirtyDaysAgo);
  const prev30 = sellerOrders.filter(o => o.createdAt >= sixtyDaysAgo && o.createdAt < thirtyDaysAgo);
  const revLast30 = last30.reduce((sum, o) => {
    const items = o.items as Array<{ productId: number; quantity: number; price: number }>;
    return sum + items.filter(i => sellerPids.has(i.productId)).reduce((s, i) => s + i.price * i.quantity, 0);
  }, 0);
  const revPrev30 = prev30.reduce((sum, o) => {
    const items = o.items as Array<{ productId: number; quantity: number; price: number }>;
    return sum + items.filter(i => sellerPids.has(i.productId)).reduce((s, i) => s + i.price * i.quantity, 0);
  }, 0);
  const revenueGrowth = revPrev30 > 0 ? ((revLast30 - revPrev30) / revPrev30) * 100 : 0;

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    totalProducts: Number(productsCount.count),
    pendingOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
  });
});

router.get("/seller/sales", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const parsed = GetSellerSalesQueryParams.safeParse(req.query);
  const period = parsed.success ? (parsed.data.period ?? "30d") : "30d";

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sellerProductIds = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.sellerId, userId));
  const sellerPids = new Set(sellerProductIds.map(p => p.id));

  const orders = await db.select().from(ordersTable).where(gte(ordersTable.createdAt, since));

  // Group by date
  const dateMap: Record<string, { revenue: number; orders: number }> = {};
  for (let d = 0; d < days; d++) {
    const date = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    dateMap[key] = { revenue: 0, orders: 0 };
  }

  for (const o of orders) {
    const items = o.items as Array<{ productId: number; quantity: number; price: number }>;
    const hasSellerItems = items.some(i => sellerPids.has(i.productId));
    if (!hasSellerItems) continue;
    const key = o.createdAt.toISOString().slice(0, 10);
    if (!dateMap[key]) dateMap[key] = { revenue: 0, orders: 0 };
    const rev = items.filter(i => sellerPids.has(i.productId)).reduce((s, i) => s + i.price * i.quantity, 0);
    dateMap[key].revenue += rev;
    dateMap[key].orders += 1;
  }

  res.json(Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
    date,
    revenue: Math.round(v.revenue * 100) / 100,
    orders: v.orders,
  })));
});

router.get("/seller/orders", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const parsed = ListSellerOrdersQueryParams.safeParse(req.query);
  const statusFilter = parsed.success ? parsed.data.status : undefined;

  const sellerProductIds = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.sellerId, userId));
  const sellerPids = new Set(sellerProductIds.map(p => p.id));

  const allOrders = await db
    .select({ order: ordersTable, buyerName: usersTable.name })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.buyerId, usersTable.id))
    .orderBy(desc(ordersTable.createdAt));

  const filtered = allOrders.filter(r => {
    const items = r.order.items as Array<{ productId: number }>;
    const hasItems = items.some(i => sellerPids.has(i.productId));
    if (!hasItems) return false;
    if (statusFilter) return r.order.status === statusFilter;
    return true;
  });

  res.json(filtered.map(r => ({
    id: r.order.id,
    buyerId: r.order.buyerId,
    buyerName: r.buyerName ?? "",
    items: r.order.items as unknown[],
    subtotal: parseFloat(r.order.subtotal as unknown as string),
    discount: parseFloat(r.order.discount as unknown as string),
    total: parseFloat(r.order.total as unknown as string),
    status: r.order.status,
    shippingAddress: r.order.shippingAddress,
    createdAt: r.order.createdAt.toISOString(),
  })));
});

router.get("/seller/top-products", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const sellerProducts = await db.select().from(productsTable).where(eq(productsTable.sellerId, userId));
  const sellerPids = new Set(sellerProducts.map(p => p.id));
  const productMap = new Map(sellerProducts.map(p => [p.id, p]));

  const allOrders = await db.select().from(ordersTable);
  const stats: Record<number, { totalSold: number; revenue: number }> = {};

  for (const o of allOrders) {
    const items = o.items as Array<{ productId: number; quantity: number; price: number }>;
    for (const item of items) {
      if (!sellerPids.has(item.productId)) continue;
      if (!stats[item.productId]) stats[item.productId] = { totalSold: 0, revenue: 0 };
      stats[item.productId].totalSold += item.quantity;
      stats[item.productId].revenue += item.price * item.quantity;
    }
  }

  const result = Object.entries(stats)
    .map(([pid, s]) => {
      const p = productMap.get(Number(pid));
      if (!p) return null;
      return {
        productId: Number(pid),
        name: p.name,
        imageUrl: p.imageUrl,
        totalSold: s.totalSold,
        revenue: Math.round(s.revenue * 100) / 100,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.revenue - a!.revenue)
    .slice(0, 5);

  res.json(result);
});

export default router;
