import mongoose, { Schema, type Document } from "mongoose";

export interface IHistoricalPoint {
  date: string;
  price: number;
}

export interface IStock extends Document {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  description: string;
  historicalData: IHistoricalPoint[];
  updatedAt: Date;
}

const historicalPointSchema = new Schema<IHistoricalPoint>(
  {
    date: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const stockSchema = new Schema<IStock>(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    previousClose: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },
    marketCap: { type: Number, default: 0 },
    sector: { type: String, required: true },
    description: { type: String, default: "" },
    historicalData: { type: [historicalPointSchema], default: [] },
  },
  { timestamps: true },
);

export const StockModel = mongoose.model<IStock>("Stock", stockSchema);
