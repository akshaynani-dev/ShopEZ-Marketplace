import { Router, type IRouter } from "express";
import { db, cartItemsTable, productsTable, usersTable, reviewsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { AddCartItemBody, UpdateCartItemBody, UpdateCartItemParams, RemoveCartItemParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function buildCart(userId: number) {
  const cartRows = await db
    .select({
      cartItem: cartItemsTable,
      product: productsTable,
      sellerName: usersTable.name,
      avgRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)`,
      reviewCount: sql<number>`COUNT(${reviewsTable.id})`,
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .leftJoin(reviewsTable, eq(productsTable.id, reviewsTable.productId))
    .where(eq(cartItemsTable.userId, userId))
    .groupBy(cartItemsTable.id, productsTable.id, usersTable.name);

  const items = cartRows
    .filter(r => r.product != null)
    .map(r => {
      const p = r.product!;
      const price = parseFloat(p.price as unknown as string);
      const discount = parseFloat(p.discountPercent as unknown as string);
      return {
        productId: r.cartItem.productId,
        quantity: r.cartItem.quantity,
        product: {
          id: p.id,
          name: p.name,
          description: p.description,
          price,
          discountPercent: discount,
          category: p.category,
          imageUrl: p.imageUrl,
          stock: p.stock,
          sellerId: p.sellerId,
          sellerName: r.sellerName ?? "",
          rating: Number(r.avgRating),
          reviewCount: Number(r.reviewCount),
          createdAt: p.createdAt.toISOString(),
        },
      };
    });

  let subtotal = 0;
  let discount = 0;
  for (const item of items) {
    const itemPrice = item.product.price * item.quantity;
    const itemDiscount = (item.product.discountPercent / 100) * itemPrice;
    subtotal += itemPrice;
    discount += itemDiscount;
  }

  return { items, subtotal: Math.round(subtotal * 100) / 100, discount: Math.round(discount * 100) / 100, total: Math.round((subtotal - discount) * 100) / 100 };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  res.json(await buildCart(userId));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  res.sendStatus(204);
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { productId, quantity } = parsed.data;

  const existing = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(cartItemsTable)
      .set({ quantity: existing[0].quantity + quantity })
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));
  } else {
    await db.insert(cartItemsTable).values({ userId, productId, quantity });
  }

  res.json(await buildCart(userId));
});

router.patch("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;

  if (parsed.data.quantity <= 0) {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, params.data.productId)));
  } else {
    await db.update(cartItemsTable)
      .set({ quantity: parsed.data.quantity })
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, params.data.productId)));
  }

  res.json(await buildCart(userId));
});

router.delete("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, params.data.productId)));
  res.json(await buildCart(userId));
});

export default router;
