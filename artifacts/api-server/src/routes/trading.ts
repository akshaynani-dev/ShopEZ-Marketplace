import { Router, type IRouter } from "express";
import { StockModel, TransactionModel, HoldingModel, UserModel } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { z } from "zod";

const router: IRouter = Router();

const TradeInput = z.object({
  symbol: z.string().min(1),
  quantity: z.number().int().positive(),
});

function formatTx(t: InstanceType<typeof TransactionModel>) {
  return {
    id: t._id.toString(),
    userId: t.userId.toString(),
    symbol: t.symbol,
    stockName: t.stockName,
    type: t.type,
    quantity: t.quantity,
    price: t.price,
    total: t.total,
    createdAt: t.createdAt.toISOString(),
  };
}

router.post("/trade/buy", requireAuth, async (req, res): Promise<void> => {
  const parsed = TradeInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { symbol, quantity } = parsed.data;
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const stock = await StockModel.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  const total = Math.round(stock.price * quantity * 100) / 100;

  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.virtualBalance < total) {
    res.status(400).json({ error: "Insufficient funds" });
    return;
  }

  user.virtualBalance = Math.round((user.virtualBalance - total) * 100) / 100;
  await user.save();

  const tx = await TransactionModel.create({
    userId,
    symbol: stock.symbol,
    stockName: stock.name,
    type: "buy",
    quantity,
    price: stock.price,
    total,
  });

  const existing = await HoldingModel.findOne({ userId, symbol: stock.symbol });
  if (existing) {
    const newQty = existing.quantity + quantity;
    existing.avgBuyPrice = Math.round(
      ((existing.avgBuyPrice * existing.quantity + stock.price * quantity) / newQty) * 100,
    ) / 100;
    existing.quantity = newQty;
    await existing.save();
  } else {
    await HoldingModel.create({
      userId,
      symbol: stock.symbol,
      stockName: stock.name,
      quantity,
      avgBuyPrice: stock.price,
    });
  }

  res.json({ transaction: formatTx(tx), newBalance: user.virtualBalance });
});

router.post("/trade/sell", requireAuth, async (req, res): Promise<void> => {
  const parsed = TradeInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { symbol, quantity } = parsed.data;
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const stock = await StockModel.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  const holding = await HoldingModel.findOne({ userId, symbol: stock.symbol });
  if (!holding || holding.quantity < quantity) {
    res.status(400).json({ error: "Insufficient shares" });
    return;
  }

  const total = Math.round(stock.price * quantity * 100) / 100;

  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  user.virtualBalance = Math.round((user.virtualBalance + total) * 100) / 100;
  await user.save();

  const tx = await TransactionModel.create({
    userId,
    symbol: stock.symbol,
    stockName: stock.name,
    type: "sell",
    quantity,
    price: stock.price,
    total,
  });

  holding.quantity -= quantity;
  if (holding.quantity === 0) {
    await holding.deleteOne();
  } else {
    await holding.save();
  }

  res.json({ transaction: formatTx(tx), newBalance: user.virtualBalance });
});

export default router;
