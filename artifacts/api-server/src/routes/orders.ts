import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { OrderModel, CartItemModel, ProductModel, UserModel } from "@workspace/db";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { IOrder } from "@workspace/db";
import type { Request } from "express";

const router: IRouter = Router();

function formatOrder(o: IOrder, buyerName: string) {
  return {
    id: o._id.toString(),
    buyerId: o.buyerId.toString(),
    buyerName,
    items: o.items,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    status: o.status,
    shippingAddress: o.shippingAddress,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const orders = await OrderModel.find({ buyerId: new mongoose.Types.ObjectId(userId) }).sort({
    createdAt: -1,
  });
  const buyer = await UserModel.findById(userId);
  res.json(orders.map((o) => formatOrder(o, buyer?.name ?? "")));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const userOid = new mongoose.Types.ObjectId(userId);

  const cartItems = await CartItemModel.find({ userId: userOid });
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const productIds = cartItems.map((c) => c.productId);
  const products = await ProductModel.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  let discount = 0;
  const items = cartItems
    .map((c) => {
      const p = productMap.get(c.productId.toString());
      if (!p) return null;
      const itemTotal = p.price * c.quantity;
      const itemDiscount = (p.discountPercent / 100) * itemTotal;
      subtotal += itemTotal;
      discount += itemDiscount;
      return {
        productId: p._id.toString(),
        productName: p.name,
        quantity: c.quantity,
        price: p.price,
        imageUrl: p.imageUrl,
      };
    })
    .filter(Boolean) as NonNullable<ReturnType<typeof cartItems.map>[number]>[];

  const total = subtotal - discount;
  const buyer = await UserModel.findById(userId);

  const order = await OrderModel.create({
    buyerId: userOid,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    shippingAddress: parsed.data.shippingAddress,
    paymentMethod: parsed.data.paymentMethod,
  });

  await CartItemModel.deleteMany({ userId: userOid });

  res.status(201).json(formatOrder(order, buyer?.name ?? ""));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const order = await OrderModel.findById(id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const buyer = await UserModel.findById(order.buyerId);
  res.json(formatOrder(order, buyer?.name ?? ""));
});

router.patch("/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const order = await OrderModel.findByIdAndUpdate(
    id,
    { $set: { status: parsed.data.status } },
    { new: true },
  );
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const buyer = await UserModel.findById(order.buyerId);
  res.json(formatOrder(order, buyer?.name ?? ""));
});

export default router;
