import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICartItem extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

export const CartItemModel = mongoose.model<ICartItem>("CartItem", cartItemSchema);
