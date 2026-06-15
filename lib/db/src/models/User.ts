import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "buyer" | "seller";
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller"], default: "buyer" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
