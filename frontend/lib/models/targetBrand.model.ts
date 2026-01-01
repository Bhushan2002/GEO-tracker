import { Schema, model, models } from "mongoose";
import { Brand } from './brand.model';

const targetBrandSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    brand_name: { type: String, required: true },
    official_url: { type: String, required: true },
    actual_brand_name: { type: String },
    brand_type: { type: String },
    brand_description: { type: String },
    mainBrand: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isScheduled: { type: Boolean, default: false },
    mentions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

targetBrandSchema.index({ brand_name: 1, workspaceId: 1 }, { unique: true });

export const TargetBrand = models.TargetBrand || model("TargetBrand", targetBrandSchema);
