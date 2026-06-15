import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  buyerId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        imageUrl: { type: String, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: String, required: true },
  },
  { timestamps: true },
);

export const OrderModel = mongoose.model<IOrder>("Order", orderSchema);
