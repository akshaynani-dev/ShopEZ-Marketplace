import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { OrderModel, ProductModel, UserModel } from "@workspace/db";
import { GetSellerSalesQueryParams, ListSellerOrdersQueryParams } from "@workspace/api-zod";
import { requireAuth, requireSeller } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { IOrderItem } from "@workspace/db";
import type { Request } from "express";

const router: IRouter = Router();

router.get("/seller/products", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const products = await ProductModel.aggregate([
    { $match: { sellerId: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "productId",
        as: "reviews",
      },
    },
    {
      $addFields: {
        rating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
        reviewCount: { $size: "$reviews" },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const seller = await UserModel.findById(userId);
  res.json(
    products.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description,
      price: p.price,
      discountPercent: p.discountPercent,
      category: p.category,
      imageUrl: p.imageUrl,
      stock: p.stock,
      sellerId: String(p.sellerId),
      sellerName: seller?.name ?? "",
      rating: Math.round((p.rating ?? 0) * 10) / 10,
      reviewCount: p.reviewCount ?? 0,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    })),
  );
});

router.get("/seller/stats", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const sellerProducts = await ProductModel.find({ sellerId: new mongoose.Types.ObjectId(userId) });
  const sellerPids = new Set(sellerProducts.map((p) => p._id.toString()));
  const totalProducts = sellerProducts.length;

  const allOrders = await OrderModel.find().sort({ createdAt: -1 });

  const sellerOrders = allOrders.filter((o) =>
    o.items.some((i: IOrderItem) => sellerPids.has(i.productId)),
  );

  let totalRevenue = 0;
  let pendingOrders = 0;
  for (const o of sellerOrders) {
    const rev = o.items
      .filter((i: IOrderItem) => sellerPids.has(i.productId))
      .reduce((s: number, i: IOrderItem) => s + i.price * i.quantity, 0);
    totalRevenue += rev;
    if (o.status === "pending") pendingOrders++;
  }

  const totalOrders = sellerOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const last30 = sellerOrders.filter((o) => o.createdAt >= thirtyDaysAgo);
  const prev30 = sellerOrders.filter(
    (o) => o.createdAt >= sixtyDaysAgo && o.createdAt < thirtyDaysAgo,
  );

  const calcRev = (orders: typeof sellerOrders) =>
    orders.reduce((sum, o) => {
      return (
        sum +
        o.items
          .filter((i: IOrderItem) => sellerPids.has(i.productId))
          .reduce((s: number, i: IOrderItem) => s + i.price * i.quantity, 0)
      );
    }, 0);

  const revLast30 = calcRev(last30);
  const revPrev30 = calcRev(prev30);
  const revenueGrowth = revPrev30 > 0 ? ((revLast30 - revPrev30) / revPrev30) * 100 : 0;

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    totalProducts,
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

  const sellerProducts = await ProductModel.find({ sellerId: new mongoose.Types.ObjectId(userId) });
  const sellerPids = new Set(sellerProducts.map((p) => p._id.toString()));

  const orders = await OrderModel.find({ createdAt: { $gte: since } });

  const dateMap: Record<string, { revenue: number; orders: number }> = {};
  for (let d = 0; d < days; d++) {
    const date = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    dateMap[key] = { revenue: 0, orders: 0 };
  }

  for (const o of orders) {
    const hasSellerItems = o.items.some((i: IOrderItem) => sellerPids.has(i.productId));
    if (!hasSellerItems) continue;
    const key = o.createdAt.toISOString().slice(0, 10);
    if (!dateMap[key]) dateMap[key] = { revenue: 0, orders: 0 };
    const rev = o.items
      .filter((i: IOrderItem) => sellerPids.has(i.productId))
      .reduce((s: number, i: IOrderItem) => s + i.price * i.quantity, 0);
    dateMap[key].revenue += rev;
    dateMap[key].orders += 1;
  }

  res.json(
    Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        revenue: Math.round(v.revenue * 100) / 100,
        orders: v.orders,
      })),
  );
});

router.get("/seller/orders", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const parsed = ListSellerOrdersQueryParams.safeParse(req.query);
  const statusFilter = parsed.success ? parsed.data.status : undefined;

  const sellerProducts = await ProductModel.find({ sellerId: new mongoose.Types.ObjectId(userId) });
  const sellerPids = new Set(sellerProducts.map((p) => p._id.toString()));

  const allOrders = await OrderModel.find().sort({ createdAt: -1 });

  const filtered = allOrders.filter((o) => {
    const hasItems = o.items.some((i: IOrderItem) => sellerPids.has(i.productId));
    if (!hasItems) return false;
    if (statusFilter) return o.status === statusFilter;
    return true;
  });

  const buyerIds = [...new Set(filtered.map((o) => o.buyerId.toString()))];
  const buyers = await UserModel.find({ _id: { $in: buyerIds } });
  const buyerMap = new Map(buyers.map((b) => [b._id.toString(), b.name]));

  res.json(
    filtered.map((o) => ({
      id: o._id.toString(),
      buyerId: o.buyerId.toString(),
      buyerName: buyerMap.get(o.buyerId.toString()) ?? "",
      items: o.items,
      subtotal: o.subtotal,
      discount: o.discount,
      total: o.total,
      status: o.status,
      shippingAddress: o.shippingAddress,
      createdAt: o.createdAt.toISOString(),
    })),
  );
});

router.get("/seller/top-products", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const sellerProducts = await ProductModel.find({ sellerId: new mongoose.Types.ObjectId(userId) });
  const sellerPids = new Set(sellerProducts.map((p) => p._id.toString()));
  const productMap = new Map(sellerProducts.map((p) => [p._id.toString(), p]));

  const allOrders = await OrderModel.find();
  const stats: Record<string, { totalSold: number; revenue: number }> = {};

  for (const o of allOrders) {
    for (const item of o.items as IOrderItem[]) {
      if (!sellerPids.has(item.productId)) continue;
      if (!stats[item.productId]) stats[item.productId] = { totalSold: 0, revenue: 0 };
      stats[item.productId].totalSold += item.quantity;
      stats[item.productId].revenue += item.price * item.quantity;
    }
  }

  const result = Object.entries(stats)
    .map(([pid, s]) => {
      const p = productMap.get(pid);
      if (!p) return null;
      return {
        productId: pid,
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
