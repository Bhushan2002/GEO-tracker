import { Schema, model } from "mongoose";

const targetBrandSchema = new Schema(
  {
    brand_name: { type: String, required: true, unique: true },
    official_url: { type: String, required: true },
    actual_brand_name: { type: String },
    brand_type: { type: String },
    isActive: { type: Boolean, default: true },
    isScheduled: { type: Boolean, default: false },
    mentions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TargetBrand = model("TargetBrand", targetBrandSchema);
