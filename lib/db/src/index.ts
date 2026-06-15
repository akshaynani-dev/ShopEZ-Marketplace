import mongoose from "mongoose";

export { UserModel } from "./models/User";
export { ProductModel } from "./models/Product";
export { ReviewModel } from "./models/Review";
export { CartItemModel } from "./models/CartItem";
export { OrderModel } from "./models/Order";
export type { IUser } from "./models/User";
export type { IProduct } from "./models/Product";
export type { IReview } from "./models/Review";
export type { ICartItem } from "./models/CartItem";
export type { IOrder, IOrderItem } from "./models/Order";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI must be set");
  await mongoose.connect(uri);
}
