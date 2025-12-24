import { Schema, model } from "mongoose";
import { IBrand } from "../types/brand.type";
const brandSchema = new Schema<IBrand>(
  {
    brand_name: { type: String, required: true, unique: true, sparse: true },
    mentions: { type: Number, default: 0 },
    averageSentiment: { type: String },
    lastRank: {
      type: Number,
      default: undefined,
      unique: true,

    },
    prominence_score: { type: Number },
    context: { type: String },
    associated_links: [
      {
        url: { type: String },
        is_direct_brand_link: { type: Boolean },
        citation_type: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const Brand = model("Brand", brandSchema);
