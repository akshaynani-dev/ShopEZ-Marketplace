import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { CartItemModel, ProductModel } from "@workspace/db";
import { AddCartItemBody, UpdateCartItemBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function buildCart(userId: string) {
  const cartItems = await CartItemModel.find({
    userId: new mongoose.Types.ObjectId(userId),
  }).populate("productId");

  const productIds = cartItems.map((c) => (c.productId as unknown as mongoose.Types.ObjectId));

  const productStats = await ProductModel.aggregate([
    { $match: { _id: { $in: productIds } } },
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
  ]);

  const productMap = new Map(productStats.map((p) => [String(p._id), p]));

  type CartEntry = {
    productId: string;
    quantity: number;
    product: {
      id: string; name: string; description: string; price: number;
      discountPercent: number; category: string; imageUrl: string;
      stock: number; sellerId: string; sellerName: string;
      rating: number; reviewCount: number; createdAt: string;
    };
  };

  const items: CartEntry[] = [];
  for (const c of cartItems) {
    const pid = String(c.productId instanceof mongoose.Types.ObjectId ? c.productId : (c.productId as { _id: unknown })._id ?? c.productId);
    const p = productMap.get(pid);
    if (!p) continue;
    items.push({
      productId: pid,
      quantity: c.quantity,
      product: {
        id: pid,
        name: p.name,
        description: p.description,
        price: p.price,
        discountPercent: p.discountPercent,
        category: p.category,
        imageUrl: p.imageUrl,
        stock: p.stock,
        sellerId: String(p.sellerId),
        sellerName: p.sellerName ?? "",
        rating: Math.round((p.rating ?? 0) * 10) / 10,
        reviewCount: p.reviewCount ?? 0,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
      },
    });
  }

  let subtotal = 0;
  let discount = 0;
  for (const item of items) {
    const itemPrice = item.product.price * item.quantity;
    const itemDiscount = (item.product.discountPercent / 100) * itemPrice;
    subtotal += itemPrice;
    discount += itemDiscount;
  }

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round((subtotal - discount) * 100) / 100,
  };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  res.json(await buildCart(userId));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  await CartItemModel.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
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
  const productIdStr = String(productId);

  if (!mongoose.Types.ObjectId.isValid(productIdStr)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const productOid = new mongoose.Types.ObjectId(productIdStr);
  const userOid = new mongoose.Types.ObjectId(userId);

  const existing = await CartItemModel.findOne({ userId: userOid, productId: productOid });
  if (existing) {
    existing.quantity += quantity;
    await existing.save();
  } else {
    await CartItemModel.create({ userId: userOid, productId: productOid, quantity });
  }

  res.json(await buildCart(userId));
});

router.patch("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const productId = String(req.params.productId);
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const productOid = new mongoose.Types.ObjectId(productId);
  const userOid = new mongoose.Types.ObjectId(userId);

  if (parsed.data.quantity <= 0) {
    await CartItemModel.deleteOne({ userId: userOid, productId: productOid });
  } else {
    await CartItemModel.updateOne(
      { userId: userOid, productId: productOid },
      { $set: { quantity: parsed.data.quantity } },
    );
  }

  res.json(await buildCart(userId));
});

router.delete("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const productId = String(req.params.productId);
  const { userId } = (req as Request & { user: JwtPayload }).user;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    await CartItemModel.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });
  }
  res.json(await buildCart(userId));
});

export default router;
