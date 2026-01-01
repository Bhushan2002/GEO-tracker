import { Schema, model, models } from "mongoose";
import { IBrand } from "../types/brand.type";

const brandSchema = new Schema<IBrand>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    brand_name: { type: String, required: true },
    mentions: { type: Number, default: 0 },
    lastRank: {
      type: Number,
      default: undefined,
      sparse: true,
    },

    // Legacy fields (keep for backward compatibility)
    averageSentiment: { type: String },
    prominence_score: { type: Number },
    context: { type: String },
    associated_links: [{
      url: { type: String },
      is_direct_brand_link: { type: Boolean },
      citation_type: { type: String },
    }],

    // Comprehensive Brand Analysis
    found: { type: Boolean },
    mention_context: { type: String },
    sentiment: { type: String },
    sentiment_score: { type: Number },
    sentiment_text: { type: String },
    rank_position: { type: Number },
    funnel_stage: { type: String },
    attribute_mapping: [String],
    recommendation_strength: { type: String },

    // Domain & URL Citations
    associated_domain: [{
      domain_citation: String,
      domain_citation_source: Boolean,
      domain_citation_type: String,
      associated_url: [{
        url_citation: String,
        url_anchor_text: String,
        url_citation_source: Boolean,
        url_citation_type: String,
        url_placement: String
      }]
    }],

    alignment_analysis: { type: String }
  },
  { timestamps: true }
);

brandSchema.index({ brand_name: 1, workspaceId: 1 }, { unique: true });

export const Brand = models.Brand || model("Brand", brandSchema);
