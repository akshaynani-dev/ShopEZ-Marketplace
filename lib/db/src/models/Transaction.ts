import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  symbol: string;
  stockName: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true },
    stockName: { type: String, required: true },
    type: { type: String, enum: ["buy", "sell"], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const TransactionModel = mongoose.model<ITransaction>("Transaction", transactionSchema);
