import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { UserModel, StockModel, TransactionModel } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

function formatUser(u: InstanceType<typeof UserModel>) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    virtualBalance: u.virtualBalance,
    createdAt: u.createdAt.toISOString(),
  };
}

function formatStock(s: InstanceType<typeof StockModel>) {
  return {
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    previousClose: s.previousClose,
    change: s.change,
    changePercent: s.changePercent,
    volume: s.volume,
    marketCap: s.marketCap,
    sector: s.sector,
    description: s.description,
    historicalData: s.historicalData,
  };
}

router.get("/admin/users", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const users = await UserModel.find({}).sort({ createdAt: -1 });
  res.json(users.map(formatUser));
});

router.patch(
  "/admin/users/:userId/balance",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const { virtualBalance } = req.body;
    if (typeof virtualBalance !== "number" || virtualBalance < 0) {
      res.status(400).json({ error: "Invalid balance" });
      return;
    }
    const user = await UserModel.findByIdAndUpdate(
      req.params.userId,
      { virtualBalance },
      { new: true },
    );
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(user));
  },
);

router.get("/admin/stocks", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const stocks = await StockModel.find({}).sort({ symbol: 1 });
  res.json(stocks.map(formatStock));
});

const StockInput = z.object({
  symbol: z.string().min(1).toUpperCase(),
  name: z.string().min(1),
  price: z.number().positive(),
  previousClose: z.number().positive(),
  sector: z.string().min(1),
  description: z.string().default(""),
  volume: z.number().default(0),
  marketCap: z.number().default(0),
});

router.post("/admin/stocks", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = StockInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const change = Math.round((d.price - d.previousClose) * 100) / 100;
  const changePercent =
    d.previousClose > 0
      ? Math.round(((change / d.previousClose) * 100) * 100) / 100
      : 0;

  const stock = await StockModel.create({ ...d, change, changePercent });
  res.status(201).json(formatStock(stock));
});

router.patch(
  "/admin/stocks/:symbol",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = StockInput.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const d = parsed.data;
    const stock = await StockModel.findOne({ symbol: String(req.params.symbol).toUpperCase() });
    if (!stock) {
      res.status(404).json({ error: "Stock not found" });
      return;
    }
    Object.assign(stock, d);
    if (d.price !== undefined || d.previousClose !== undefined) {
      stock.change = Math.round((stock.price - stock.previousClose) * 100) / 100;
      stock.changePercent =
        stock.previousClose > 0
          ? Math.round(((stock.change / stock.previousClose) * 100) * 100) / 100
          : 0;
    }
    await stock.save();
    res.json(formatStock(stock));
  },
);

router.delete(
  "/admin/stocks/:symbol",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    await StockModel.deleteOne({ symbol: String(req.params.symbol).toUpperCase() });
    res.sendStatus(204);
  },
);

router.get(
  "/admin/transactions",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const txs = await TransactionModel.find({}).sort({ createdAt: -1 }).limit(200);
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
  },
);

router.post("/admin/seed", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const count = await seedStocks();
  await seedUsers();
  res.json({ message: "Seeded successfully", count });
});

async function seedUsers() {
  const users = [
    { name: "Trader Alice", email: "alice@shopez.com", password: "password123", role: "user" as const },
    { name: "Admin Boss", email: "admin@shopez.com", password: "password123", role: "admin" as const },
  ];
  for (const u of users) {
    const exists = await UserModel.findOne({ email: u.email });
    if (!exists) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await UserModel.create({ ...u, passwordHash });
    }
  }
}

export async function seedStocks(): Promise<number> {
  const existing = await StockModel.countDocuments();
  if (existing > 0) return existing;

  const stocks = getStockSeedData();
  await StockModel.insertMany(stocks);
  return stocks.length;
}

function generateHistory(currentPrice: number, days = 30): { date: string; price: number }[] {
  const history: { date: string; price: number }[] = [];
  let price = currentPrice * (0.85 + Math.random() * 0.15);
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const drift = (Math.random() - 0.48) * 0.025;
    price = Math.max(1, price * (1 + drift));
    history.push({
      date: d.toISOString().split("T")[0],
      price: Math.round(price * 100) / 100,
    });
  }
  const last = history[history.length - 1];
  if (last) last.price = currentPrice;
  return history;
}

function getStockSeedData() {
  const stocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 178.5, previousClose: 175.2, volume: 72000000, marketCap: 2780000000000, sector: "Technology", description: "Apple designs and sells consumer electronics, software, and online services." },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.9, previousClose: 372.1, volume: 25000000, marketCap: 2810000000000, sector: "Technology", description: "Microsoft develops software, services, and cloud solutions worldwide." },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 167.4, previousClose: 169.8, volume: 21000000, marketCap: 2090000000000, sector: "Technology", description: "Alphabet is the parent company of Google, offering search, ads, and cloud services." },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 188.3, previousClose: 184.7, volume: 32000000, marketCap: 1960000000000, sector: "Consumer Discretionary", description: "Amazon is a global e-commerce and cloud computing giant." },
    { symbol: "TSLA", name: "Tesla Inc.", price: 248.5, previousClose: 255.1, volume: 95000000, marketCap: 790000000000, sector: "Consumer Discretionary", description: "Tesla designs and manufactures electric vehicles and clean energy solutions." },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.4, previousClose: 856.2, volume: 42000000, marketCap: 2150000000000, sector: "Technology", description: "NVIDIA produces GPUs for gaming, AI, and data center computing." },
    { symbol: "META", name: "Meta Platforms Inc.", price: 512.7, previousClose: 505.3, volume: 15000000, marketCap: 1310000000000, sector: "Technology", description: "Meta operates Facebook, Instagram, WhatsApp, and the metaverse platform." },
    { symbol: "NFLX", name: "Netflix Inc.", price: 628.2, previousClose: 615.8, volume: 5000000, marketCap: 272000000000, sector: "Communication Services", description: "Netflix is a streaming entertainment service with 270+ million subscribers." },
    { symbol: "AMD", name: "Advanced Micro Devices", price: 178.6, previousClose: 182.4, volume: 55000000, marketCap: 289000000000, sector: "Technology", description: "AMD develops CPUs and GPUs for PCs, servers, and gaming consoles." },
    { symbol: "INTC", name: "Intel Corp.", price: 34.8, previousClose: 33.9, volume: 47000000, marketCap: 148000000000, sector: "Technology", description: "Intel manufactures semiconductors and microprocessors for computing." },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 198.4, previousClose: 195.7, volume: 9000000, marketCap: 570000000000, sector: "Financials", description: "JPMorgan Chase is the largest U.S. bank by assets." },
    { symbol: "GS", name: "Goldman Sachs Group", price: 482.3, previousClose: 475.6, volume: 2800000, marketCap: 161000000000, sector: "Financials", description: "Goldman Sachs is a leading global investment banking and financial services firm." },
    { symbol: "WMT", name: "Walmart Inc.", price: 67.2, previousClose: 66.5, volume: 16000000, marketCap: 542000000000, sector: "Consumer Staples", description: "Walmart operates retail stores and e-commerce across 24 countries." },
    { symbol: "KO", name: "The Coca-Cola Co.", price: 62.8, previousClose: 63.4, volume: 14000000, marketCap: 271000000000, sector: "Consumer Staples", description: "Coca-Cola is the world's largest beverage company." },
    { symbol: "JNJ", name: "Johnson & Johnson", price: 156.3, previousClose: 157.9, volume: 8000000, marketCap: 375000000000, sector: "Healthcare", description: "J&J develops medical devices, pharmaceuticals, and consumer products." },
    { symbol: "NKE", name: "Nike Inc.", price: 96.5, previousClose: 94.2, volume: 12000000, marketCap: 148000000000, sector: "Consumer Discretionary", description: "Nike designs and sells athletic footwear, apparel, and equipment globally." },
    { symbol: "DIS", name: "The Walt Disney Co.", price: 112.8, previousClose: 115.3, volume: 11000000, marketCap: 206000000000, sector: "Communication Services", description: "Disney is a diversified entertainment company with theme parks, studios, and streaming." },
    { symbol: "ABNB", name: "Airbnb Inc.", price: 157.4, previousClose: 154.8, volume: 6500000, marketCap: 100000000000, sector: "Consumer Discretionary", description: "Airbnb operates a global platform for short-term home rentals and experiences." },
    { symbol: "UBER", name: "Uber Technologies Inc.", price: 76.3, previousClose: 74.9, volume: 22000000, marketCap: 158000000000, sector: "Consumer Discretionary", description: "Uber operates ride-sharing, food delivery, and freight services globally." },
    { symbol: "SPOT", name: "Spotify Technology SA", price: 308.5, previousClose: 312.1, volume: 3500000, marketCap: 60000000000, sector: "Communication Services", description: "Spotify is the world's largest music and podcast streaming platform." },
  ];

  return stocks.map((s) => {
    const change = Math.round((s.price - s.previousClose) * 100) / 100;
    const changePercent = Math.round(((change / s.previousClose) * 100) * 100) / 100;
    return { ...s, change, changePercent, historicalData: generateHistory(s.price) };
  });
}

export default router;
