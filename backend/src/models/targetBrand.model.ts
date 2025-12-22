import { Schema, model } from "mongoose";

const targetBrandSchema = new Schema(
  {
    brand_name: { type: String, required: true, unique: true },
    official_url: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TargetBrand = model("TargetBrand", targetBrandSchema);
