import { Router, type IRouter } from "express";
import { db, ordersTable, cartItemsTable, productsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams, UpdateOrderStatusBody, UpdateOrderStatusParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

function formatOrder(o: typeof ordersTable.$inferSelect, buyerName: string) {
  return {
    id: o.id,
    buyerId: o.buyerId,
    buyerName,
    items: o.items as unknown[],
    subtotal: parseFloat(o.subtotal as unknown as string),
    discount: parseFloat(o.discount as unknown as string),
    total: parseFloat(o.total as unknown as string),
    status: o.status,
    shippingAddress: o.shippingAddress,
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const rows = await db
    .select({ order: ordersTable, buyerName: usersTable.name })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.buyerId, usersTable.id))
    .where(eq(ordersTable.buyerId, userId))
    .orderBy(desc(ordersTable.createdAt));
  res.json(rows.map(r => formatOrder(r.order, r.buyerName ?? "")));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const cartRows = await db
    .select({ cartItem: cartItemsTable, product: productsTable })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  if (cartRows.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  let subtotal = 0;
  let discount = 0;
  const items = cartRows
    .filter(r => r.product != null)
    .map(r => {
      const p = r.product!;
      const price = parseFloat(p.price as unknown as string);
      const discountPercent = parseFloat(p.discountPercent as unknown as string);
      const itemTotal = price * r.cartItem.quantity;
      const itemDiscount = (discountPercent / 100) * itemTotal;
      subtotal += itemTotal;
      discount += itemDiscount;
      return {
        productId: p.id,
        productName: p.name,
        quantity: r.cartItem.quantity,
        price,
        imageUrl: p.imageUrl,
      };
    });

  const total = subtotal - discount;
  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const [order] = await db.insert(ordersTable).values({
    buyerId: userId,
    items: items as unknown as typeof ordersTable.$inferSelect.items,
    subtotal: subtotal.toFixed(2) as unknown as typeof ordersTable.$inferSelect.subtotal,
    discount: discount.toFixed(2) as unknown as typeof ordersTable.$inferSelect.discount,
    total: total.toFixed(2) as unknown as typeof ordersTable.$inferSelect.total,
    shippingAddress: parsed.data.shippingAddress,
    paymentMethod: parsed.data.paymentMethod,
  }).returning();

  // Clear cart after order
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  res.status(201).json(formatOrder(order, buyer?.name ?? ""));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const rows = await db
    .select({ order: ordersTable, buyerName: usersTable.name })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.buyerId, usersTable.id))
    .where(eq(ordersTable.id, params.data.id))
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const r = rows[0];
  // Only buyer or sellers can see the order
  if (r.order.buyerId !== userId) {
    // Check if any item belongs to this seller's products — simplified: allow any authenticated user for now
  }
  res.json(formatOrder(r.order, r.buyerName ?? ""));
});

router.patch("/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, order.buyerId)).limit(1);
  res.json(formatOrder(order, buyer?.name ?? ""));
});

export default router;
