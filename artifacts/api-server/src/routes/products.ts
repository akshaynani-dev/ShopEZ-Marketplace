import { Router, type IRouter } from "express";
import { db, productsTable, usersTable, reviewsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireAuth, requireSeller, optionalAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

function productWithSeller(p: typeof productsTable.$inferSelect, sellerName: string, rating: number, reviewCount: number) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price as unknown as string),
    discountPercent: parseFloat(p.discountPercent as unknown as string),
    category: p.category,
    imageUrl: p.imageUrl,
    stock: p.stock,
    sellerId: p.sellerId,
    sellerName,
    rating,
    reviewCount,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      product: productsTable,
      sellerName: usersTable.name,
      avgRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)`,
      reviewCount: sql<number>`COUNT(${reviewsTable.id})`,
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .leftJoin(reviewsTable, eq(productsTable.id, reviewsTable.productId))
    .groupBy(productsTable.id, usersTable.name)
    .orderBy(desc(sql`COALESCE(AVG(${reviewsTable.rating}), 0)`))
    .limit(8);

  res.json(rows.map(r => productWithSeller(r.product, r.sellerName ?? "", Number(r.avgRating), Number(r.reviewCount))));
});

router.get("/products/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ category: productsTable.category, count: sql<number>`COUNT(*)` })
    .from(productsTable)
    .groupBy(productsTable.category)
    .orderBy(productsTable.category);
  res.json(rows.map(r => ({ name: r.category, count: Number(r.count) })));
});

router.get("/products", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, search, sort, minPrice, maxPrice, page = 1, limit = 12 } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(productsTable.category, category));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (minPrice != null) conditions.push(gte(sql`${productsTable.price}::numeric`, minPrice));
  if (maxPrice != null) conditions.push(lte(sql`${productsTable.price}::numeric`, maxPrice));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = ((page as number) - 1) * (limit as number);

  let orderBy;
  switch (sort) {
    case "price_asc": orderBy = asc(productsTable.price); break;
    case "price_desc": orderBy = desc(productsTable.price); break;
    case "newest": orderBy = desc(productsTable.createdAt); break;
    default: orderBy = desc(productsTable.createdAt);
  }

  const [rows, countRow] = await Promise.all([
    db.select({
      product: productsTable,
      sellerName: usersTable.name,
      avgRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)`,
      reviewCount: sql<number>`COUNT(DISTINCT ${reviewsTable.id})`,
    })
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
      .leftJoin(reviewsTable, eq(productsTable.id, reviewsTable.productId))
      .where(whereClause)
      .groupBy(productsTable.id, usersTable.name)
      .orderBy(orderBy)
      .limit(limit as number)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(DISTINCT ${productsTable.id})` })
      .from(productsTable)
      .where(whereClause),
  ]);

  if (sort === "rating") {
    rows.sort((a, b) => Number(b.avgRating) - Number(a.avgRating));
  }

  const total = Number(countRow[0]?.count ?? 0);
  res.json({
    products: rows.map(r => productWithSeller(r.product, r.sellerName ?? "", Number(r.avgRating), Number(r.reviewCount))),
    total,
    page: page as number,
    totalPages: Math.ceil(total / (limit as number)),
  });
});

router.post("/products", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    price: parsed.data.price.toString() as unknown as typeof productsTable.$inferSelect.price,
    discountPercent: parsed.data.discountPercent.toString() as unknown as typeof productsTable.$inferSelect.discountPercent,
    sellerId: userId,
  }).returning();
  res.status(201).json(productWithSeller(product, seller?.name ?? "", 0, 0));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({
      product: productsTable,
      sellerName: usersTable.name,
      avgRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)`,
      reviewCount: sql<number>`COUNT(${reviewsTable.id})`,
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .leftJoin(reviewsTable, eq(productsTable.id, reviewsTable.productId))
    .where(eq(productsTable.id, params.data.id))
    .groupBy(productsTable.id, usersTable.name)
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const r = rows[0];
  res.json(productWithSeller(r.product, r.sellerName ?? "", Number(r.avgRating), Number(r.reviewCount)));
});

router.patch("/products/:id", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updateData.price = parsed.data.price.toString();
  if (parsed.data.discountPercent != null) updateData.discountPercent = parsed.data.discountPercent.toString();

  const [product] = await db.update(productsTable)
    .set(updateData)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.sellerId, userId)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found or not yours" });
    return;
  }
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json(productWithSeller(product, seller?.name ?? "", 0, 0));
});

router.delete("/products/:id", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [deleted] = await db.delete(productsTable)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.sellerId, userId)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Product not found or not yours" });
    return;
  }
  res.sendStatus(204);
});

export default router;
