import { Router, type IRouter } from "express";
import { StockModel } from "@workspace/db";

const router: IRouter = Router();

router.get("/stocks/movers", async (_req, res): Promise<void> => {
  const stocks = await StockModel.find({}, "-historicalData -__v");
  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.slice(0, 5).map(formatStock);
  const losers = sorted.slice(-5).reverse().map(formatStock);
  res.json({ gainers, losers });
});

router.get("/stocks", async (req, res): Promise<void> => {
  const { q, sector, sort } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (q) filter["$or"] = [
    { symbol: { $regex: q, $options: "i" } },
    { name: { $regex: q, $options: "i" } },
  ];
  if (sector) filter["sector"] = sector;

  const stocks = await StockModel.find(filter, "-historicalData -__v");

  let result = stocks.map(formatStock);

  if (sort === "price_asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "change_asc") result.sort((a, b) => a.changePercent - b.changePercent);
  else if (sort === "change_desc") result.sort((a, b) => b.changePercent - a.changePercent);
  else if (sort === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));

  const allStocks = await StockModel.find({}, "sector");
  const sectors = [...new Set(allStocks.map((s) => s.sector))].sort();

  res.json({ stocks: result, sectors });
});

router.get("/stocks/:symbol", async (req, res): Promise<void> => {
  const stock = await StockModel.findOne({ symbol: req.params.symbol.toUpperCase() }, "-__v");
  if (!stock) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }
  res.json(formatStockFull(stock));
});

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
    historicalData: [],
  };
}

function formatStockFull(s: InstanceType<typeof StockModel>) {
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

export default router;
