import mongoose from "mongoose";

export { UserModel } from "./models/User";
export { StockModel } from "./models/Stock";
export { TransactionModel } from "./models/Transaction";
export { HoldingModel } from "./models/Holding";
export type { IUser } from "./models/User";
export type { IStock, IHistoricalPoint } from "./models/Stock";
export type { ITransaction } from "./models/Transaction";
export type { IHolding } from "./models/Holding";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI must be set");
  await mongoose.connect(uri);
}
