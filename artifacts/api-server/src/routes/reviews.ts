import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { ReviewModel, UserModel } from "@workspace/db";
import { CreateReviewBody } from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

router.get("/products/:productId/reviews", optionalAuth, async (req, res): Promise<void> => {
  const productId = String(req.params.productId);
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.json([]);
    return;
  }

  const reviews = await ReviewModel.find({ productId: new mongoose.Types.ObjectId(productId) })
    .sort({ createdAt: 1 })
    .populate<{ userId: { _id: mongoose.Types.ObjectId; name: string } }>("userId", "name");

  res.json(
    reviews.map((r) => ({
      id: r._id.toString(),
      productId: r.productId.toString(),
      userId: r.userId._id ? r.userId._id.toString() : r.userId.toString(),
      userName: (r.userId as unknown as { name?: string }).name ?? "Anonymous",
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/products/:productId/reviews", requireAuth, async (req, res): Promise<void> => {
  const productId = String(req.params.productId);
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const user = await UserModel.findById(userId);

  const review = await ReviewModel.create({
    productId: new mongoose.Types.ObjectId(productId),
    userId: new mongoose.Types.ObjectId(userId),
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  res.status(201).json({
    id: review._id.toString(),
    productId: review.productId.toString(),
    userId: review.userId.toString(),
    userName: user?.name ?? "Anonymous",
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
