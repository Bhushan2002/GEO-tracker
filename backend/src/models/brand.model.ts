import { Schema, model } from "mongoose";
import { IBrand } from "../types/brand.type";

const brandSchema = new Schema<IBrand>({
  brandName: { type: String, required: true, unique: true },
  mentions: { type: Number, default: 1 },
  averageSentiment: {type: String},
  lastRank: {type: Number}
}, { timestamps: true });

export const Brand = model("Brand", brandSchema);