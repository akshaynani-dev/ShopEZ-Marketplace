import { Router, type IRouter } from "express";
import { HoldingModel, TransactionModel, StockModel, UserModel } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router: IRouter = Router();

router.get("/portfolio", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;

  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const holdings = await HoldingModel.find({ userId });

  const symbols = holdings.map((h) => h.symbol);
  const stocks = await StockModel.find({ symbol: { $in: symbols } }, "symbol price");
  const priceMap = new Map(stocks.map((s) => [s.symbol, s.price]));

  let totalValue = 0;
  let totalInvested = 0;

  const enriched = holdings.map((h) => {
    const currentPrice = priceMap.get(h.symbol) ?? h.avgBuyPrice;
    const currentValue = Math.round(currentPrice * h.quantity * 100) / 100;
    const invested = Math.round(h.avgBuyPrice * h.quantity * 100) / 100;
    const profitLoss = Math.round((currentValue - invested) * 100) / 100;
    const profitLossPercent =
      invested > 0 ? Math.round(((profitLoss / invested) * 100) * 100) / 100 : 0;

    totalValue += currentValue;
    totalInvested += invested;

    return {
      symbol: h.symbol,
      stockName: h.stockName,
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
    };
  });

  const totalProfitLoss = Math.round((totalValue - totalInvested) * 100) / 100;
  const totalProfitLossPercent =
    totalInvested > 0
      ? Math.round(((totalProfitLoss / totalInvested) * 100) * 100) / 100
      : 0;

  res.json({
    holdings: enriched,
    totalValue: Math.round(totalValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalProfitLoss,
    totalProfitLossPercent,
    cashBalance: user.virtualBalance,
  });
});

router.get("/portfolio/transactions", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const txs = await TransactionModel.find({ userId }).sort({ createdAt: -1 }).limit(100);
  res.json(
    txs.map((t) => ({
      id: t._id.toString(),
      userId: t.userId.toString(),
      symbol: t.symbol,
      stockName: t.stockName,
      type: t.type,
      quantity: t.quantity,
      price: t.price,
      total: t.total,
      createdAt: t.createdAt.toISOString(),
    })),
  );
});

export default router;
