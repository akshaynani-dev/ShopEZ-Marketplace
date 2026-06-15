import { Router, type IRouter } from "express";
import { db, reviewsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateReviewBody, CreateReviewParams, ListReviewsParams } from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

router.get("/products/:productId/reviews", optionalAuth, async (req, res): Promise<void> => {
  const params = ListReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({ review: reviewsTable, userName: usersTable.name })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.productId, params.data.productId))
    .orderBy(reviewsTable.createdAt);

  res.json(rows.map(r => ({
    id: r.review.id,
    productId: r.review.productId,
    userId: r.review.userId,
    userName: r.userName ?? "Anonymous",
    rating: r.review.rating,
    comment: r.review.comment,
    createdAt: r.review.createdAt.toISOString(),
  })));
});

router.post("/products/:productId/reviews", requireAuth, async (req, res): Promise<void> => {
  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const [review] = await db.insert(reviewsTable).values({
    productId: params.data.productId,
    userId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  }).returning();

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: user?.name ?? "Anonymous",
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
