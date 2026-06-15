import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { ProductModel, UserModel } from "@workspace/db";
import { ListProductsQueryParams, CreateProductBody, UpdateProductBody } from "@workspace/api-zod";
import { requireAuth, requireSeller, optionalAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

function formatProduct(p: Record<string, unknown>) {
  return {
    id: String(p._id),
    name: p.name,
    description: p.description,
    price: p.price,
    discountPercent: p.discountPercent,
    category: p.category,
    imageUrl: p.imageUrl,
    stock: p.stock,
    sellerId: String(p.sellerId),
    sellerName: p.sellerName ?? "",
    rating: typeof p.rating === "number" ? Math.round(p.rating * 10) / 10 : 0,
    reviewCount: p.reviewCount ?? 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

const withReviewsPipeline = [
  {
    $lookup: {
      from: "users",
      localField: "sellerId",
      foreignField: "_id",
      as: "seller",
    },
  },
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
      sellerName: { $ifNull: [{ $arrayElemAt: ["$seller.name", 0] }, ""] },
      rating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
      reviewCount: { $size: "$reviews" },
    },
  },
];

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await ProductModel.aggregate([
    ...withReviewsPipeline,
    { $sort: { rating: -1 } },
    { $limit: 8 },
  ]);
  res.json(rows.map(formatProduct));
});

router.get("/products/categories", async (_req, res): Promise<void> => {
  const rows = await ProductModel.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(rows.map((r) => ({ name: r._id, count: r.count })));
});

router.get("/products", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, search, sort, minPrice, maxPrice, page = 1, limit = 12 } = parsed.data;

  const match: Record<string, unknown> = {};
  if (category) match.category = category;
  if (search) match.name = { $regex: search, $options: "i" };
  if (minPrice != null || maxPrice != null) {
    match.price = {};
    if (minPrice != null) (match.price as Record<string, number>).$gte = minPrice;
    if (maxPrice != null) (match.price as Record<string, number>).$lte = maxPrice;
  }

  type SortVal = 1 | -1;
  let sortStage: Record<string, SortVal> = { createdAt: -1 };
  if (sort === "price_asc") sortStage = { price: 1 };
  else if (sort === "price_desc") sortStage = { price: -1 };
  else if (sort === "rating") sortStage = { rating: -1 };

  const offset = ((page as number) - 1) * (limit as number);

  const [rows, totalResult] = await Promise.all([
    ProductModel.aggregate([
      { $match: match },
      ...withReviewsPipeline,
      { $sort: sortStage },
      { $skip: offset },
      { $limit: limit as number },
    ]),
    ProductModel.countDocuments(match),
  ]);

  res.json({
    products: rows.map(formatProduct),
    total: totalResult,
    page: page as number,
    totalPages: Math.ceil(totalResult / (limit as number)),
  });
});

router.post("/products", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const seller = await UserModel.findById(userId);

  const product = await ProductModel.create({
    ...parsed.data,
    sellerId: new mongoose.Types.ObjectId(userId),
  });

  res.status(201).json(
    formatProduct({
      ...product.toObject(),
      sellerName: seller?.name ?? "",
      rating: 0,
      reviewCount: 0,
    }),
  );
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const rows = await ProductModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    ...withReviewsPipeline,
    { $limit: 1 },
  ]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(rows[0]));
});

router.patch("/products/:id", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: "Product not found or not yours" });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const product = await ProductModel.findOneAndUpdate(
    { _id: id, sellerId: new mongoose.Types.ObjectId(userId) },
    { $set: parsed.data },
    { new: true },
  );

  if (!product) {
    res.status(404).json({ error: "Product not found or not yours" });
    return;
  }

  const seller = await UserModel.findById(userId);
  res.json(
    formatProduct({
      ...product.toObject(),
      sellerName: seller?.name ?? "",
      rating: 0,
      reviewCount: 0,
    }),
  );
});

router.delete("/products/:id", requireAuth, requireSeller, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: "Product not found or not yours" });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const deleted = await ProductModel.findOneAndDelete({
    _id: id,
    sellerId: new mongoose.Types.ObjectId(userId),
  });
  if (!deleted) {
    res.status(404).json({ error: "Product not found or not yours" });
    return;
  }
  res.sendStatus(204);
});

export default router;
