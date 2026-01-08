import { Schema, model, models } from "mongoose";
import { IBrand } from "../types/brand.type";

/**
 * Mongoose Schema for the Brand entity.
 * Stores analysis data for a specific brand found within a prompt response.
 * Includes sentiment, ranking, and citation details.
 */
const brandSchema = new Schema<IBrand>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },

    brand_name: { type: String, required: true },

    // Core KPIs
    mentions: { type: Number, default: 0 },
    lastRank: { type: Number, default: undefined, sparse: true }, // Sparse index allows multiple nulls
    sentiment_sum: { type: Number, default: 0 },
    total_evaluations: { type: Number, default: 0 },

    // --- Legacy Fields (Maintained for Backward Compatibility) ---
    averageSentiment: { type: String },
    prominence_score: { type: Number },
    context: { type: String },
    associated_links: [{
      url: { type: String },
      is_direct_brand_link: { type: Boolean },
      citation_type: { type: String },
    }],

    // --- Comprehensive Brand Analysis ---
    found: { type: Boolean },
    mention_context: { type: String },
    sentiment: { type: String },
    sentiment_score: { type: Number },
    sentiment_text: { type: String },
    rank_position: { type: Number },
    funnel_stage: { type: String },
    attribute_mapping: [String],
    recommendation_strength: { type: String },

    // --- Domain & URL Citations ---
    // Tracks where this brand was mentioned and the type of citation
    associated_domain: [{
      domain_citation: String,
      domain_citation_source: Boolean,
      domain_citation_type: String, // e.g., 'Editorial', 'UGC', 'Competitor'
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

// Optimize lookups by brand name within a specific workspace
brandSchema.index({ brand_name: 1, workspaceId: 1 }, { unique: true });

export const Brand = models.Brand || model("Brand", brandSchema);
