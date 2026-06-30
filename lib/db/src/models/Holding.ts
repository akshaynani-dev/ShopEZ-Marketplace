import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IHolding extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  symbol: string;
  stockName: string;
  quantity: number;
  avgBuyPrice: number;
}

const holdingSchema = new Schema<IHolding>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true },
    stockName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true },
  },
  { timestamps: false },
);

holdingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const HoldingModel = mongoose.model<IHolding>("Holding", holdingSchema);
