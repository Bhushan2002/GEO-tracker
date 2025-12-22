import { Schema, model, models } from "mongoose";

const targetBrandSchema = new Schema(
  {
    brand_name: { type: String, required: true, unique: true },
    official_url: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isScheduled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TargetBrand = models.TargetBrand || model("TargetBrand", targetBrandSchema);
