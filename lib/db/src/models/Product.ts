import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  category: string;
  imageUrl: string;
  stock: number;
  sellerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    stock: { type: Number, default: 0 },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const ProductModel = mongoose.model<IProduct>("Product", productSchema);
